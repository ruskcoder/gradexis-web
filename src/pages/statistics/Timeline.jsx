import React, { useMemo } from 'react';
import { Timeline, TimelineItem } from '@/components/timeline';
import { TrendingUp, TrendingDown, GraduationCap } from 'lucide-react';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item"
import { Badge } from '@/components/ui/badge';
import { gradeAndColor, ClassGradesList, ClassGradesItem } from '@/components/custom/grades-item';
import { categoryColor } from '@/components/custom/grades-stats';
import { useCurrentUser } from '@/lib/store';

export const TimelinePage = ({ selectedGrade, term }) => {
  const currentUser = useCurrentUser();

  const timelineEvents = useMemo(() => {
    if (!selectedGrade || !currentUser || !term) return [];

    const gradesStore = currentUser.gradesStore || {};
    const termHistory = gradesStore.history?.[term] || [];

    if (termHistory.length === 0) return [];

    const events = [];

    const firstLoad = termHistory[0];
    const firstCourse = firstLoad.classes?.find(
      (c) => c.name === selectedGrade.name && c.course === selectedGrade.course
    );

    if (firstCourse) {
      const changes = {};
      changes.average = { prev: 0, curr: parseFloat(firstCourse.average) || 0, change: parseFloat(firstCourse.average) || 0 };

      const categories = Object.keys(firstCourse.categories || {});
      for (const category of categories) {
        const currPercent = parseFloat(firstCourse.categories?.[category]?.percent) || 0;
        changes[category] = { prev: 0, curr: currPercent, change: currPercent };
      }

      const changedAssignments = firstCourse.scores || [];

      events.push({
        date: new Date(firstLoad.loadedAt),
        changes,
        changedAssignments,
      });
    }

    for (let i = 1; i < termHistory.length; i++) {
      const prevLoad = termHistory[i - 1];
      const currentLoad = termHistory[i];

      const prevCourse = prevLoad.classes?.find(
        (c) => c.name === selectedGrade.name && c.course === selectedGrade.course
      );
      const currCourse = currentLoad.classes?.find(
        (c) => c.name === selectedGrade.name && c.course === selectedGrade.course
      );

      if (!prevCourse || !currCourse) continue;

      const changes = {};
      let hasChanges = false;

      const prevAvg = parseFloat(prevCourse.average) || 0;
      const currAvg = parseFloat(currCourse.average) || 0;
      if (prevAvg !== currAvg) {
        changes.average = { prev: prevAvg, curr: currAvg, change: currAvg - prevAvg };
        hasChanges = true;
      }

      const categories = Object.keys(currCourse.categories || {});
      for (const category of categories) {
        const prevPercent = parseFloat(prevCourse.categories?.[category]?.percent) || 0;
        const currPercent = parseFloat(currCourse.categories?.[category]?.percent) || 0;
        if (prevPercent !== currPercent) {
          changes[category] = { prev: prevPercent, curr: currPercent, change: currPercent - prevPercent };
          hasChanges = true;
        }
      }

      const prevScores = prevCourse.scores || [];
      const currScores = currCourse.scores || [];
      const changedAssignments = [];

      for (const currScore of currScores) {
        const prevScore = prevScores.find(s => s.name === currScore.name);
        if (!prevScore) {

          changedAssignments.push(currScore);
        } else if (prevScore.score !== currScore.score || prevScore.percentage !== currScore.percentage) {

          changedAssignments.push(currScore);
        }
      }

      if (hasChanges || changedAssignments.length > 0) {
        events.push({
          date: new Date(currentLoad.loadedAt),
          changes: hasChanges ? changes : {},
          changedAssignments,
        });
      }
    }

    return events;
  }, [selectedGrade, currentUser, term]);

  const ChangeBadge = ({ change }) => {
    const pct = Math.abs(change).toPrecision(3);
    const badgeClass =
      change > 0
        ? 'text-sm px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        : change < 0
          ? 'text-sm px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          : 'text-sm px-2 py-0.5 rounded bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';

    const icon = change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : null;

    return (
      <Badge className={badgeClass}>
        {icon && <span className="mr-1">{icon}</span>}
        {change > 0 ? `+${pct}` : `-${pct}`}
      </Badge>
    );
  };

  const AverageItem = ({ prevAvg, currAvg, change, isInitial }) => {
    const { grade: gradeValue, gradeColor } = gradeAndColor(currAvg);

    return (
      <Item variant="outline" className="h-full w-fit p-3 gap-3 flex-nowrap">
        <ItemContent>
          <ItemTitle>
            <span
              className={`block font-semibold tracking-wide text-[1.5rem] text-white text-center rounded-sm px-2 py-[2px] ${gradeColor} min-w-[86px]`}
            >
              {gradeValue}
            </span>
          </ItemTitle>
        </ItemContent>
        {!isInitial && (
          <ItemActions>
            <ChangeBadge change={change} />
          </ItemActions>
        )}
      </Item>
    );
  };

  const CategoryItem = ({ category, prevGrade, currGrade, change, isInitial }) => {
    const percent = parseFloat(currGrade).toPrecision(4);
    return (
      <Item className={`h-full p-2 max-w-[300px] transition-colors flex-nowrap gap-2 ${isInitial ? "pr-3" : ""}`} variant="outline">
        <ItemActions className="pr-1">
          <div className="w-5 h-11 rounded-sm" style={{ backgroundColor: categoryColor(category) }}></div>
        </ItemActions>
        <ItemContent className="gap-0">
          <ItemTitle>{category}</ItemTitle>
          <ItemTitle className="text-xl/5">
            {percent}
            {!isInitial && <ChangeBadge change={change} />}
          </ItemTitle>
        </ItemContent>
      </Item>
    );
  };

  if (timelineEvents.length === 0) {
    return (
      <div className="text-muted-foreground text-center h-full flex items-center justify-center">
        No grade changes available for this course.
      </div>
    );
  }

  return (
    <div>
      <Timeline size="sm">
        {[...timelineEvents].reverse().map((event, idx, arr) => {
          const isLatest = idx === 0;
          const isInitial = idx === arr.length - 1;
          const title = isLatest ? 'Latest Load' : isInitial ? 'Initial Load' : 'Grade Updated';
          return (
          <TimelineItem
            key={idx}
            date={event.date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            })}
            title={title}
            description={
              <div className="flex flex-col gap-3">
                {Object.keys(event.changes).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {event.changes.average && (
                      <AverageItem
                        prevAvg={event.changes.average.prev}
                        currAvg={event.changes.average.curr}
                        change={event.changes.average.change}
                        isInitial={isInitial}
                      />
                    )}
                    {Object.entries(event.changes)
                      .filter(([key]) => key !== 'average')
                      .map(([category, data]) => (
                        <CategoryItem
                          key={category}
                          category={category}
                          prevGrade={data.prev}
                          currGrade={data.curr}
                          change={data.change}
                          isInitial={isInitial}
                        />
                      ))}
                  </div>
                )}
                {event.changedAssignments.length > 0 && (
                  <div className="max-w-[400px]">
                    <p className="text-xs text-muted-foreground mb-2">Updated Assignments:</p>
                    <ClassGradesList>
                      {event.changedAssignments.map((scoreData, scoreIdx) => (
                        <ClassGradesItem
                          key={scoreIdx}
                          scoreData={scoreData}
                        />
                      ))}
                    </ClassGradesList>
                  </div>
                )}
              </div>
            }
            icon={<GraduationCap className="w-4 h-4" />}
          />
          );
        })}
      </Timeline>
    </div>
  );
};