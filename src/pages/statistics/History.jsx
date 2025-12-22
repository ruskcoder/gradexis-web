import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { categoryColor } from '@/components/custom/grades-stats'
import { useCurrentUser } from '@/lib/store'

export const History = ({ selectedGrade, term }) => {
  const currentUser = useCurrentUser();

  const historyData = useMemo(() => {
    if (!selectedGrade || !currentUser || !term) return null;

    const gradesStore = currentUser.gradesStore || {};
    const termHistory = gradesStore.history?.[term] || {};
    
    const courseKey = `${selectedGrade.course}|${selectedGrade.name}`;
    const courseHistory = termHistory[courseKey] || [];

    if (courseHistory.length === 0) return null;

    const historyList = courseHistory.map((entry) => {
      const loadDate = new Date(entry.loadedAt).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).replace(/,/, '');

      const dataPoint = {
        time: loadDate,
        timestamp: entry.loadedAt,
        Average: parseFloat(entry.average) || 0,
      };

      if (entry.categories) {
        Object.entries(entry.categories).forEach(([categoryName, categoryData]) => {
          dataPoint[categoryName] = parseFloat(categoryData.percent) || 0;
        });
      }

      return dataPoint;
    });

    return historyList;
  }, [selectedGrade, currentUser, term]);

  if (!historyData || historyData.length === 0) {
    return (
      <div className="text-muted-foreground text-center h-full flex items-center justify-center">
        No history data available for this course.
      </div>
    );
  }

  const categories = selectedGrade?.categories
    ? Object.keys(selectedGrade.categories)
    : [];

  return (
    <div className="space-y-6 overflow-y-auto pb-4 grid grid-cols-1 gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <Card className="mb-0 h-fit">
        <CardHeader>
          <CardTitle>Grade History</CardTitle>
        </CardHeader>
        <CardContent className="w-full h-[250px]">
          <ChartContainer
            config={{
              Average: {
                label: 'Average',
                color: '#3b82f6',
              },
            }}
            className="w-full h-full"
          >
            <BarChart
              width={400}
              height={250}
              data={historyData}
              margin={{ left: 12, right: 12, top: 0, bottom: 0 }}
              maxBarSize={50}
            >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                />
                <Bar
                  dataKey="Average"
                  fill="#3b82f6"
                  isAnimationActive={false}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
        </CardContent>
      </Card>

      {}
      {categories.map((category) => (
        <Card key={category} className="mb-0 h-fit">
          <CardHeader>
            <CardTitle>{category}</CardTitle>
          </CardHeader>
          <CardContent className="w-full h-[250px]">
            <ChartContainer
              config={{
                [category]: {
                  label: category,
                  color: categoryColor(category),
                },
              }}
              className="w-full h-full"
            >
              <BarChart
                width={400}
                height={250}
                data={historyData}
                margin={{ left: 12, right: 12, top: 0, bottom: 0 }}
              maxBarSize={50}
              >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.1)' }}
                  />
                  <Bar
                    dataKey={category}
                    fill={categoryColor(category)}
                    isAnimationActive={false}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

