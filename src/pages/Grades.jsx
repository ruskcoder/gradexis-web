import React, { useEffect, useState } from 'react'
import { Progress } from "@/components/ui/progress"
import { GradesItem, GradesList, ClassGradesItem, ClassGradesList } from '../components/custom/grades-item'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from '@/components/ui/button'
import { PremiumDialog } from '@/components/custom/premium-dialog'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { RingGradeStat, CategoryGradeStat, CategoryGradeList } from '@/components/custom/grades-stats'
import { useCurrentUser } from '@/lib/store'
import { getClasses } from '@/lib/grades-api'
import { WhatIf } from '@/pages/calculators/WhatIf'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { useLocation } from 'react-router-dom'

export default function Grades() {
  const [terms, setTerms] = useState([]);
  const [currentTerm, setCurrentTerm] = useState('');
  const [progressByTerm, setProgressByTerm] = useState({});
  const [classesDataByTerm, setClassesDataByTerm] = useState({});
  const [selectedGrade, setSelectedGrade] = useState(null);
  const [loadingTerms, setLoadingTerms] = useState({});
  const [whatIfMode, setWhatIfMode] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

  const user = useCurrentUser();
  const location = useLocation();

  async function fetchClasses(term = null, { initial = false } = {}) {
    const key = initial ? 'initial' : term;
    setLoadingTerms(prev => ({ ...prev, [key]: true }));
    setProgressByTerm(prev => ({ ...prev, [key]: { percent: initial ? 0 : 4, message: 'Initializing Connection' } }));
    try {
      const generator = getClasses(term);
      for await (const chunk of generator) {
        if (chunk.percent !== undefined) {
          setProgressByTerm(prev => ({ ...prev, [key]: { percent: chunk.percent, message: chunk.message } }));
        } else if (chunk.success === true) {
          if (initial) {
            setTerms(chunk.termList);
            setCurrentTerm(chunk.term);
            setClassesDataByTerm(prev => ({ ...prev, [chunk.term]: chunk.classes }));
            setLoadingTerms(prev => ({ ...prev, initial: false }));
          } else {
            setClassesDataByTerm(prev => ({ ...prev, [term]: chunk.classes }));
            setLoadingTerms(prev => ({ ...prev, [term]: false }));
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
    const params = new URLSearchParams(location.search);
    setWhatIfMode(params.has('whatif'));
  }, [location.search]);

  useEffect(() => {
    if (whatIfMode && user && !user.premium) {
      setShowPremiumDialog(true);
    }
  }, [whatIfMode, user]);

  const handleTabChange = (term) => {
    setCurrentTerm(term);
    setSelectedGrade(null);
    if (classesDataByTerm[term] || loadingTerms[term]) return;
    fetchClasses(term);
  };
  const showTitle = user ? user.showPageTitles !== false : true;

  return (
    <div className="space-y-8 flex flex-col h-full overflow-clip" style={{ zoom: '0.9' }}>
      {showTitle &&
        <div className="flex items-center justify-between w-full">
          <h1 className="text-4xl font-bold">Grades</h1>
          <Button variant="outline" className="w-32" onClick={() => setWhatIfMode(!whatIfMode)}>
            {whatIfMode ? (<><ChevronLeft /> Grades</>) : (<>What If <ChevronRight /></>)}
          </Button>
        </div>
      }
      <PremiumDialog 
        open={showPremiumDialog} 
        onOpenChange={setShowPremiumDialog}
        onCancel={() => setWhatIfMode(false)}
        showCancel={true}
      />
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
                {(loadingTerms[currentTerm] || loadingTerms.initial) && <div>
                  <div className='w-full text-center my-2'>{progressByTerm[currentTerm]?.message || progressByTerm.initial?.message}</div>
                  <Progress value={progressByTerm[currentTerm]?.percent || progressByTerm.initial?.percent || 0} />
                </div>}
                {!loadingTerms[currentTerm] && !loadingTerms.initial && classesDataByTerm[currentTerm] && (
                  <TabsContent value={currentTerm} className="mt-2">
                    {classesDataByTerm[currentTerm].length === 0 ? (
                      <div className="flex items-center justify-center h-16">
                        <p className="text-muted-foreground">No classes to display</p>
                      </div>
                    ) : (
                      <GradesList variant={user.gradesView}>
                        {classesDataByTerm[currentTerm].map((course, index) => (
                          <div key={index} onClick={() => setSelectedGrade(course)}>
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
              {!selectedGrade ? (
                <p className="text-muted-foreground text-center h-full flex items-center justify-center max-h-[46px]">
                  Select a grade to continue.
                </p>
              ) : !whatIfMode ? (
                <>
                  <div className="flex gap-4 overflow-x-auto mb-4">
                    <RingGradeStat grade={parseFloat(selectedGrade.average).toPrecision(4)} />
                    <CategoryGradeList>
                      {Object.entries(selectedGrade.categories || {}).map(([categoryName, categoryData]) => (
                        <CategoryGradeStat
                          key={categoryName}
                          categoryData={{ category: categoryName, ...categoryData }}
                        />
                      ))}
                    </CategoryGradeList>
                  </div>
                  <ClassGradesList>
                    {(selectedGrade.scores || []).map((score, index) => (
                      <ClassGradesItem key={index} scoreData={score} />
                    ))}
                  </ClassGradesList>
                </>
              ) : (
                <WhatIf selectedGrade={selectedGrade} />
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  )
}