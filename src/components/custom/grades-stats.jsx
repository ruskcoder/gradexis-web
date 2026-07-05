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
import { useCurrentUser } from "@/lib/store"
import { formatGrade } from "@/lib/grade-display"

// Mirrors the mobile app's grade-category-color.ts — covers both the short
// ("major"/"minor"/"other") and the "<x> grade" category names schools return.
const CATEGORY_COLORS = {
  "major": "#a855f7",
  "application grade": "#a855f7",
  "minor": "#22c55e",
  "minor grade": "#22c55e",
  "other": "#eab308",
  "major grade": "#eab308",
}

export const categoryColor = (category) => {
  return CATEGORY_COLORS[category.toLowerCase()] ?? "#6b7280"
}

export function RingGradeStat({ grade, whatif = false, whatifGrade = null }) {
  const currentUser = useCurrentUser()
  const numberDisplay = currentUser?.numberDisplay ?? 'decimal'
  const numeric = parseFloat(grade)
  const displayGrade = formatGrade(numeric, numberDisplay)
  return (
    <Item className="block w-fit" variant="outline">
      <ItemContent className="w-fit">
        <ProgressCircle
          className="w-40 h-40"
          value={numeric}
          text={displayGrade}
          label={whatif ? "From": "Overall"}
          label2={ whatif && whatifGrade !== null && whatifGrade !== undefined ? formatGrade(parseFloat(whatifGrade), numberDisplay) : null }
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
  const currentUser = useCurrentUser()
  const numberDisplay = currentUser?.numberDisplay ?? 'decimal'
  const categoryName = categoryData.category || Object.keys(categoryData)[0]
  const data = typeof categoryData.category === 'string' ? categoryData : categoryData[categoryName]

  const percent = formatGrade(parseFloat(data.percent || data.categoryPoints || 0), numberDisplay)

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