import React, { useMemo } from 'react'
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { categoryColorHex } from '@/components/custom/grades-stats'
import { useStore } from '@/lib/store'

export const History = ({ selectedGrade, term }) => {
  const currentUser = useStore((state) => {
    const { users, currentUserIndex } = state;
    if (users.length === 0 || currentUserIndex < 0 || currentUserIndex >= users.length) {
      return null;
    }
    return users[currentUserIndex];
  });

  const historyData = useMemo(() => {
    if (!selectedGrade || !currentUser || !term) return null;

    const gradesStore = currentUser.gradesStore || {};
    const termHistory = gradesStore.history?.[term] || [];

    if (termHistory.length === 0) return null;

    const courseHistory = [];
    for (const load of termHistory) {
      const courseData = load.classes?.find(
        (c) => c.name === selectedGrade.name && c.course === selectedGrade.course
      );

      if (courseData) {
        const loadDate = new Date(load.loadedAt).toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).replace(/,/, '');

        const dataPoint = {
          time: loadDate,
          timestamp: load.loadedAt,
          Average: parseFloat(courseData.average) || 0,
        };

        if (courseData.categories) {
          Object.entries(courseData.categories).forEach(([categoryName, categoryData]) => {
            dataPoint[categoryName] = parseFloat(categoryData.percent) || 0;
          });
        }

        courseHistory.push(dataPoint);
      }
    }

    return courseHistory;
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
    <div className="space-y-6 overflow-y-auto h-full pb-4 grid grid-cols-1 gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      <Card className="mb-0">
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
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
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
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {}
      {categories.map((category) => (
        <Card key={category} className="mb-0">
          <CardHeader>
            <CardTitle>{category}</CardTitle>
          </CardHeader>
          <CardContent className="w-full h-[250px]">
            <ChartContainer
              config={{
                [category]: {
                  label: category,
                  color: categoryColorHex(category),
                },
              }}
              className="w-full h-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
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
                    fill={categoryColorHex(category)}
                    isAnimationActive={false}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

