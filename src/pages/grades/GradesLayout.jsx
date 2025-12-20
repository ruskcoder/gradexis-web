import React, { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Progress } from "@/components/ui/progress"
import { GradesItem, GradesList } from '@/components/custom/grades-item'
import {
  Tabs,
  TabsContent,
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
import { getClasses } from '@/lib/grades-api'
import { getLatestGradesLoad, getInitialTerm, getTermList, hasStorageData } from '@/lib/grades-store'
import { PremiumDialog } from '@/components/custom/premium-dialog'
import { History } from '@/pages/statistics/History'

export function GradesLayout({ showTitle = true, pageTitle = 'Grades', element }) {
  const [terms, setTerms] = useState([]);
  const [currentTerm, setCurrentTerm] = useState('');
  const [progressByTerm, setProgressByTerm] = useState({});
  const [classesDataByTerm, setClassesDataByTerm] = useState({});
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [loadingTerms, setLoadingTerms] = useState({});
  const [storageMode, setStorageMode] = useState({});
  const [lastLoadedDate, setLastLoadedDate] = useState({});
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

  const user = useCurrentUser();
  const location = useLocation();
  const abortControllerRef = useRef({});
  const userHasSelectedTermRef = useRef(false);
  const isWhatIfMode = location.pathname === '/grades/whatif';

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
    } catch (error) {
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
    setSelectedGrade(null);
    if (classesDataByTerm[term] || loadingTerms[term]) return;
    fetchClasses(term);
  };

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
              <div className="flex-1 overflow-y-auto">
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
                {!loadingTerms[currentTerm] && !loadingTerms.initial && classesDataByTerm[currentTerm] && (
                  <TabsContent value={currentTerm} className="mt-2">
                    {storageMode[currentTerm] && (
                      <div className="mb-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                        Last Loaded: {formatDate(lastLoadedDate[currentTerm])}
                      </div>
                    )}
                    {classesDataByTerm[currentTerm].length === 0 ? (
                      <div className="flex items-center justify-center h-16">
                        <p className="text-muted-foreground">No classes to display</p>
                      </div>
                    ) : (
                      <GradesList variant={user.gradesView}>
                        {classesDataByTerm[currentTerm].map((course, index) => (
                          <div 
                            key={index} 
                            onClick={() => course.average && setSelectedGrade(course)}
                          >
                            <GradesItem
                              courseName={course.name}
                              id={course.course}
                              grade={course.average}
                            />
                          </div>
                        ))}
                      </GradesList>
                    )}
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel className='bg-card rounded-xl border flex flex-col min-w-[412px]'>
            <div className='flex items-center justify-between py-2 px-6 border-b'>
              <div className='text-center text-sm font-medium text-muted-foreground flex-1 py-1'>
                {selectedGrade ? selectedGrade.name : 'Grade Details'}
              </div>
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
              ) : (
                React.cloneElement(element, { selectedGrade, term: currentTerm })
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}