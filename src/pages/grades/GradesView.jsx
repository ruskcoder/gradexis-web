import React, { useMemo, useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { RingGradeStat, CategoryGradeStat, CategoryGradeList } from '@/components/custom/grades-stats'
import { ClassGradesItem, ClassGradesList } from '@/components/custom/grades-item'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useCurrentUser } from '@/lib/store'

export function GradesView({ selectedGrade, timeTravel = false, term }) {
  const currentUser = useCurrentUser()
  const location = useLocation()
  const [historyIndex, setHistoryIndex] = useState(0)

  const history = useMemo(() => {
    if (!currentUser || !term || !selectedGrade) return []
    const termHistory = currentUser.gradesStore?.history?.[term]
    if (!termHistory) return []

    const courseKey = `${selectedGrade.course}|${selectedGrade.name}`
    return termHistory[courseKey] || []
  }, [currentUser, term, selectedGrade])

  useEffect(() => {
    setHistoryIndex(0)
  }, [selectedGrade])

  useEffect(() => {
    if (timeTravel && location.state?.historyIndex !== undefined) {
      setHistoryIndex(location.state.historyIndex)
    }
  }, [timeTravel, location.state])

  const displayedGrade = useMemo(() => {
    if (!timeTravel || !selectedGrade || history.length === 0) {
      return selectedGrade
    }

    const historyItem = history[historyIndex]
    if (!historyItem) return selectedGrade

    return {
      ...selectedGrade,
      average: historyItem.average,
      categories: historyItem.categories,
      scores: historyItem.scores,
    }
  }, [timeTravel, selectedGrade, history, historyIndex])

  const displayedTimestamp = useMemo(() => {
    if (!timeTravel || history.length === 0) {
      return null
    }

    const historyItem = history[historyIndex]
    if (!historyItem) return null

    const date = new Date(historyItem.loadedAt)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }, [timeTravel, history, historyIndex])

  if (!selectedGrade) {
    return (
      <p className="text-muted-foreground text-center h-full flex items-center justify-center max-h-[46px]">
        Select a grade to continue.
      </p>
    )
  }

  return (
    <>
      {timeTravel && (
        <Card className="gap-2 mb-4">
          <CardHeader>
            <CardTitle className='text-center'>
              {history.length === 1 && (
                <div className="flex flex-col gap-2">
                  <span className="text-muted-foreground">No History Available, Viewing: {displayedTimestamp || 'No data'}</span>
                </div>
              )}
              {history.length > 1 && (
                displayedTimestamp || 'Drag the slider to view a date'
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Slider
              value={[historyIndex]}
              onValueChange={(value) => setHistoryIndex(value[0])}
              max={Math.max(0, history.length - 1)}
              step={1}
              className={"w-full"}
              disabled={history.length === 0}
            />
          </CardContent>
        </Card>
      )}
      <div className="flex gap-4 overflow-x-auto mb-4">
        <RingGradeStat grade={parseFloat(displayedGrade.average).toPrecision(4)} />
        <CategoryGradeList>
          {Object.entries(displayedGrade.categories || {}).map(([categoryName, categoryData]) => (
            <CategoryGradeStat
              key={categoryName}
              categoryData={{ category: categoryName, ...categoryData }}
            />
          ))}
        </CategoryGradeList>
      </div>
      <ClassGradesList>
        {(displayedGrade.scores || []).map((score, index) => (
          <ClassGradesItem key={index} scoreData={score} />
        ))}
      </ClassGradesList>
    </>
  )
}

