import React from "react"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item"
import { ProgressCircle } from "@/components/ui/circular-progress"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export const categoryColor = (category) => {
  switch (category.toLowerCase()) {
    case "major":
      return "#a855f7" 

    case "minor":
      return "#22c55e" 

    case "other":
      return "#eab308" 

    default:
      return "#6b7280" 

  }
}

export function RingGradeStat({ grade, whatif = false, whatifGrade = null }) {
  grade = parseFloat(grade).toPrecision(4)
  return (
    <Item className="block w-fit" variant="outline">
      <ItemContent className="w-fit">
        <ProgressCircle
          className="w-40 h-40"
          value={grade}
          text={grade}
          label={whatif ? "From": "Overall"}
          label2={ whatif ? `${whatifGrade}` : null }
          key="ring"
        />
      </ItemContent>
    </Item>
  )
}

export function CategoryGradeList({ children }) {
  const childArray = React.Children.toArray(children)
  const count = childArray.length
  const cols = Math.min(3, Math.max(1, Math.ceil(count / 2)))

  const maxGridWidth = cols * 300

  return (
    <div
      className="grid gap-4 flex-1"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(150px, 1fr))`,
        gridAutoRows: "auto",
        gridTemplateRows: `repeat(2, auto)`,
        justifyItems: "stretch",
        gap: "1rem",
        width: "100%",
        maxWidth: `${maxGridWidth}px`,
      }}
    >
      {childArray}
    </div>
  )
}

export function CategoryGradeStat({ categoryData }) {
  const categoryName = categoryData.category || Object.keys(categoryData)[0]
  const data = typeof categoryData.category === 'string' ? categoryData : categoryData[categoryName]

  const percent = parseFloat(data.percent || data.categoryPoints || 0).toPrecision(4)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Item className="py-3 gap-2 max-w-[300px] min-w-[150px] cursor-pointer hover:bg-accent transition-colors" variant="outline">
          <ItemContent className="gap-0">
            <ItemTitle>{categoryName}</ItemTitle>
            <ItemTitle className="text-2xl">{percent}</ItemTitle>
          </ItemContent>
          <ItemActions className="pr-1">
            <div className="w-5 h-10 rounded-sm" style={{ backgroundColor: categoryColor(categoryName) }}></div>
          </ItemActions>
        </Item>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">{categoryName}</h4>
            <p className="text-sm text-muted-foreground">
              Detailed breakdown
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-2 items-center gap-4">
              <span className="text-sm font-medium">Percent:</span>
              <span className="text-sm">{data.percent}</span>
            </div>
            {data.studentsPoints !== undefined && (
              <>
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="text-sm font-medium">Your Points:</span>
                  <span className="text-sm">{data.studentsPoints}</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="text-sm font-medium">Max Points:</span>
                  <span className="text-sm">{data.maximumPoints}</span>
                </div>
              </>
            )}
            {data.categoryWeight !== undefined && (
              <>
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="text-sm font-medium">Weight:</span>
                  <span className="text-sm">{data.categoryWeight}</span>
                </div>
                <div className="grid grid-cols-2 items-center gap-4">
                  <span className="text-sm font-medium">Category Points:</span>
                  <span className="text-sm">{data.categoryPoints}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}