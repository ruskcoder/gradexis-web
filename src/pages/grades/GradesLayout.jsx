import React, { useEffect, useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Progress } from "@/components/ui/progress"
import { GradesItem, GradesList } from '@/components/custom/grades-item'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useCurrentUser } from '@/lib/store'
import { getClasses, getSingleClass } from '@/lib/grades-api'
import { getLatestGradesLoad, getInitialTerm, getTermList, hasStorageData, addGradesLoad } from '@/lib/grades-store'
import { transformGroupsToCategories } from '@/lib/utils'
import { PremiumDialog } from '@/components/custom/premium-dialog'
import { ChevronLeft, GitCommitHorizontal, Loader2 } from 'lucide-react'

// Matches the CSS `ease` used across the app so the term transition curve is
// identical to the rest of the UI. A pure opacity cross-fade (no horizontal
// slide) — the slide caused transformed content to spill past the scroll
// container and flash scrollbars on every term switch.
const TERM_EASE = [0.25, 0.1, 0.25, 1]
const termPageVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
}
// Staggered fade-up reveal for the grade list/cards, mirroring the mobile
// cascade — each item rises a few px into place a beat after the previous. The
// small y drift is clipped by the `overflow-hidden` stage wrapper below so it
// can't extend the scroll area.
const gradesListContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.035 } },
}
const gradeItemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: TERM_EASE } },
}

export function GradesLayout({ showTitle = true, pageTitle = 'Grades', element }) {
  const [terms, setTerms] = useState([]);
  const [currentTerm, setCurrentTerm] = useState('');
  // Skyward-style portals return every term's averages in one payload plus a
  // `subterms` map (e.g. { "1ST": ["PR1","PR2"] }). When present we render a
  // second tab bar (the subtabs) under the term tabs and read grades from each
  // class's `averages` dict by the selected label — no re-fetch per term.
  const [subtermsMap, setSubtermsMap] = useState({});
  const [hasSubterms, setHasSubterms] = useState(false);
  const [currentSubterm, setCurrentSubterm] = useState(null);
  const [allInOneClasses, setAllInOneClasses] = useState(null);
  const [progressByTerm, setProgressByTerm] = useState({});
  const [classesDataByTerm, setClassesDataByTerm] = useState({});
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [loadingTerms, setLoadingTerms] = useState({});
  const [storageMode, setStorageMode] = useState({});
  const [lastLoadedDate, setLastLoadedDate] = useState({});
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

  const user = useCurrentUser();
  const location = useLocation();
  const navigate = useNavigate();
  const abortControllerRef = useRef({});
  const userHasSelectedTermRef = useRef(false);
  const animationsEnabled = user ? user.animationsEnabled !== false : true;
  const isWhatIfMode = location.pathname === '/grades/whatif';
  const isTimeTravelMode = location.pathname === '/statistics/timetravel';
  const isTimelineMode = location.pathname === '/statistics/timeline';

  async function fetchClasses(term = null, { initial = false } = {}) {
    const key = initial ? 'initial' : term;
    setLoadingTerms(prev => ({ ...prev, [key]: true }));
    setProgressByTerm(prev => ({ ...prev, [key]: { percent: initial ? 0 : 4, message: 'Initializing Connection' } }));

    const controller = new AbortController();
    abortControllerRef.current[key] = controller;

    try {
      const generator = getClasses(term);
      for await (const chunk of generator) {
        if (controller.signal.aborted) return;

        if (chunk.percent !== undefined) {
          setProgressByTerm(prev => ({ ...prev, [key]: { percent: chunk.percent, message: chunk.message } }));
        } else if (chunk.success === true) {
          if (initial) {
            setTerms(chunk.termList);

            // Detect the all-in-one (Skyward-style) shape: a `subterms` map or
            // per-class `averages` dicts mean every term is already in-hand.
            const allInOne = !!chunk.hasSubterms || (chunk.classes?.[0]?.averages != null);
            setHasSubterms(!!chunk.hasSubterms);
            setSubtermsMap(chunk.subterms || {});
            if (allInOne) setAllInOneClasses(chunk.classes);

            if (!userHasSelectedTermRef.current) {
              setCurrentTerm(chunk.term);
            }
            setClassesDataByTerm(prev => ({ ...prev, [chunk.term]: chunk.classes }));

            setLoadingTerms(prev => {
              const newState = { ...prev };
              delete newState.initial;
              newState[chunk.term] = false;
              return newState;
            });
            setProgressByTerm(prev => {
              const newState = { ...prev };
              delete newState.initial;
              return newState;
            });
            setStorageMode(prev => ({ ...prev, [chunk.term]: false }));
            setLastLoadedDate(prev => ({ ...prev, [chunk.term]: new Date() }));
          } else {
            setClassesDataByTerm(prev => ({ ...prev, [term]: chunk.classes }));
            setLoadingTerms(prev => ({ ...prev, [term]: false }));
            setProgressByTerm(prev => {
              const newState = { ...prev };
              delete newState[term];
              return newState;
            });
            setStorageMode(prev => ({ ...prev, [term]: false }));
            setLastLoadedDate(prev => ({ ...prev, [term]: new Date() }));
          }
        }
      }
    } catch (_) {
      setLoadingTerms(prev => ({ ...prev, [key]: false }));
    }
  }

  useEffect(() => {
    fetchClasses(null, { initial: true });
  }, []);

  useEffect(() => {
    if (isWhatIfMode && user && !user.premium) {
      setShowPremiumDialog(true);
    }
  }, [isWhatIfMode, user]);

  const handleTabChange = (term) => {
    userHasSelectedTermRef.current = true;
    setCurrentTerm(term);
    setCurrentSubterm(null);
    setSelectedGrade(null);
    // All-in-one portals already hold every term's grades — just switch labels.
    if (allInOneClasses) return;
    if (classesDataByTerm[term] || loadingTerms[term]) return;
    fetchClasses(term);
  };

  const handleSubtermChange = (subterm) => {
    // The first pill re-selects the parent term itself (its own overall grade).
    setCurrentSubterm(subterm === currentTerm ? null : subterm);
    setSelectedGrade(null);
  };

  // The label whose grade/detail we actually show: the chosen subterm, else the
  // selected term. Resolve a class's grade from its averages dict (Skyward) or
  // its single `average` (HAC and other per-term portals).
  const effectiveTerm = currentSubterm || currentTerm;
  const resolveGrade = (course) =>
    course && course.averages ? (course.averages[effectiveTerm] ?? '') : course?.average;
  const subtabsForTerm = hasSubterms ? (subtermsMap[currentTerm] || []) : [];
  const displayClasses = allInOneClasses || classesDataByTerm[currentTerm];

  // Averages-only portals (Skyward) hand back grades without assignment scores;
  // fetch the per-class detail on demand so every right-panel element (grades,
  // what-if, impacts, ...) receives a class enriched with scores + categories,
  // and persist that detail into history for the storage/timeline features.
  const [detailByKey, setDetailByKey] = useState({});
  const [detailLoadingKey, setDetailLoadingKey] = useState(null);
  const detailKey = selectedGrade ? `${selectedGrade.course}|${effectiveTerm}` : null;
  const needsDetail = !!selectedGrade && !isTimeTravelMode &&
    !(selectedGrade.scores && selectedGrade.scores.length) && !!selectedGrade.averages;

  useEffect(() => {
    if (!needsDetail || !detailKey || detailByKey[detailKey]) return;
    let cancelled = false;
    setDetailLoadingKey(detailKey);
    getSingleClass(selectedGrade.course, effectiveTerm)
      .then((data) => {
        if (cancelled) return;
        const raw = data && data.class;
        if (!raw) return;
        // Flatten multi-group semesters (Skyward SM1/SM2) into categories/scores.
        const cls = transformGroupsToCategories(raw);
        setDetailByKey((prev) => ({ ...prev, [detailKey]: cls }));
        addGradesLoad(effectiveTerm, [{ ...selectedGrade, ...cls }]);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setDetailLoadingKey((k) => (k === detailKey ? null : k));
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailKey, needsDetail]);

  const enrichedGrade = selectedGrade
    ? (needsDetail && detailByKey[detailKey] ? { ...selectedGrade, ...detailByKey[detailKey] } : selectedGrade)
    : null;
  const detailLoading = needsDetail && !detailByKey[detailKey];

  const handleLoadFromStorage = () => {
    const isInitialLoad = loadingTerms.initial;
    const termToLoad = isInitialLoad ? getInitialTerm() : currentTerm;

    if (!termToLoad) return;

    const latestLoad = getLatestGradesLoad(termToLoad);

    if (latestLoad) {
      if (isInitialLoad) {
        const storedTermList = getTermList();
        setTerms(storedTermList);
        setCurrentTerm(termToLoad);
        setClassesDataByTerm(prev => ({ ...prev, [termToLoad]: latestLoad.classes }));
        setLoadingTerms(prev => ({ ...prev, initial: false }));
        setStorageMode(prev => ({ ...prev, [termToLoad]: true }));
        setLastLoadedDate(prev => ({ ...prev, [termToLoad]: new Date(latestLoad.loadedAt) }));
      } else {
        setClassesDataByTerm(prev => ({ ...prev, [termToLoad]: latestLoad.classes }));
        setLoadingTerms(prev => ({ ...prev, [termToLoad]: false }));
        setStorageMode(prev => ({ ...prev, [termToLoad]: true }));
        setLastLoadedDate(prev => ({ ...prev, [termToLoad]: new Date(latestLoad.loadedAt) }));
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleViewLatestInTimeTravel = () => {
    if (!selectedGrade || !currentTerm) return;

    const gradesStore = user?.gradesStore || {};
    const termHistory = gradesStore.history?.[currentTerm] || {};
    const courseKey = `${selectedGrade.course}|${selectedGrade.name}`;
    const courseHistory = termHistory[courseKey] || [];

    if (courseHistory.length === 0) return;

    // Latest index is the last entry in the course history
    const latestIndex = courseHistory.length - 1;

    navigate('/statistics/timetravel', {
      state: {
        selectedGrade,
        term: currentTerm,
        historyIndex: latestIndex,
        from: 'timeline'
      }
    });
  };

  return (
    <div className="space-y-8 flex flex-col h-full overflow-clip" style={{ zoom: '0.9' }}>
      {showTitle &&
        <div className="flex items-center justify-between w-full">
          <h1 className="text-4xl font-bold">{pageTitle}</h1>
        </div>
      }
      <div className="flex overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className='space-x-2'>
          <ResizablePanel
            className='bg-card rounded-xl p-6 border flex flex-col gap-6 align-center min-w-[412px]'
            defaultSize={60}
          >
            <Tabs value={currentTerm} onValueChange={handleTabChange} className="w-full flex flex-col flex-1">
              {terms.length !== 0 && <TabsList className="w-full">
                {terms.map((tab) => (
                  <TabsTrigger key={tab} value={tab}>
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>}
              {subtabsForTerm.length > 0 && (
                <div className="flex w-full gap-1 mt-2 rounded-lg bg-muted p-1">
                  {[currentTerm, ...subtabsForTerm].map((sub) => {
                    const active = effectiveTerm === sub;
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => handleSubtermChange(sub)}
                        className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          active ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              )}
              {/* overflow-x-hidden kills the horizontal scrollbar; the inner
                  overflow-hidden wrapper clips the reveal's small vertical drift
                  so it can't extend the vertical scroll area either. */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                <div className="overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentTerm || 'initial'}
                    variants={animationsEnabled ? termPageVariants : undefined}
                    initial={animationsEnabled ? 'enter' : false}
                    animate={animationsEnabled ? 'center' : undefined}
                    exit={animationsEnabled ? 'exit' : undefined}
                    transition={{ duration: 0.18, ease: TERM_EASE }}
                  >
                    {(loadingTerms[currentTerm] || loadingTerms.initial) && <div className='flex flex-col items-center justify-center'>
                      <div className='w-full text-center my-2'>{progressByTerm[currentTerm]?.message || progressByTerm.initial?.message}</div>
                      <Progress value={progressByTerm[currentTerm]?.percent || progressByTerm.initial?.percent || 0} />
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        onClick={handleLoadFromStorage}
                        disabled={!hasStorageData(loadingTerms.initial ? getInitialTerm() : currentTerm)}
                      >
                        Load from Storage
                      </Button>
                    </div>}
                    {!loadingTerms[currentTerm] && !loadingTerms.initial && displayClasses && (
                      <div className="mt-2">
                        {storageMode[currentTerm] && (
                          <div className="mb-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                            Last Loaded: {formatDate(lastLoadedDate[currentTerm])}
                          </div>
                        )}
                        {displayClasses.length === 0 ? (
                          <div className="flex items-center justify-center h-16">
                            <p className="text-muted-foreground">No classes to display</p>
                          </div>
                        ) : (
                          <motion.div
                            variants={animationsEnabled ? gradesListContainer : undefined}
                            initial={animationsEnabled ? 'hidden' : false}
                            animate={animationsEnabled ? 'show' : undefined}
                          >
                            <GradesList variant={user.gradesView}>
                              {displayClasses.map((course, index) => {
                                const grade = resolveGrade(course);
                                return (
                                  <motion.div
                                    key={index}
                                    variants={animationsEnabled ? gradeItemVariants : undefined}
                                    onClick={() => grade && setSelectedGrade(course)}
                                  >
                                    <GradesItem
                                      courseName={course.name}
                                      id={course.course}
                                      grade={grade}
                                    />
                                  </motion.div>
                                );
                              })}
                            </GradesList>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
                </div>
              </div>
            </Tabs>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel className='bg-card rounded-xl border flex flex-col min-w-[412px]'>
            <div className='flex items-center justify-between py-2 px-2 border-b'>
              {isTimeTravelMode &&
                <Button
                  size="sm"
                  variant="outline"
                  className='h-7 w-7 p-0'
                  onClick={() => navigate('/statistics/timeline')}
                  title="Go to Timeline"
                >
                  <ChevronLeft size={18} />
                </Button>
              }
              {isTimelineMode && selectedGrade &&
                <Button
                  size="sm"
                  variant="outline"
                  className='h-7 w-7 p-0'
                  onClick={handleViewLatestInTimeTravel}
                  title="View in TimeTravel"
                >
                  <GitCommitHorizontal size={18} />
                </Button>
              }
              <div className='text-center text-sm font-medium text-muted-foreground flex-1 py-1'>
                {selectedGrade ? selectedGrade.name : 'Grade Details'}
              </div>
              {isTimeTravelMode ? (
                <div className="w-7"></div>
              ) : null}
              {isTimelineMode && selectedGrade ? (
                <div className="w-7"></div>
              ) : null}
            </div>
            <div className='p-6 flex-1 overflow-y-auto'>
              <PremiumDialog
                open={showPremiumDialog}
                onOpenChange={setShowPremiumDialog}
              />
              {!selectedGrade ? (
                <p className="text-muted-foreground text-center h-full flex items-center justify-center max-h-[46px]">
                  Select a grade to continue.
                </p>
              ) : detailLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                  <Loader2 className="animate-spin" size={28} />
                  <span className="text-sm">Loading assignments…</span>
                </div>
              ) : (
                React.cloneElement(element, { selectedGrade: enrichedGrade, term: effectiveTerm })
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}