import React from 'react'
import { RingGradeStat, CategoryGradeStat, CategoryGradeList } from '@/components/custom/grades-stats'
import { ClassGradesItem, ClassGradesList } from '@/components/custom/grades-item'

export function GradesView({ selectedGrade }) {
  if (!selectedGrade) {
    return (
      <p className="text-muted-foreground text-center h-full flex items-center justify-center max-h-[46px]">
        Select a grade to continue.
      </p>
    )
  }

  return (
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
  )
}
