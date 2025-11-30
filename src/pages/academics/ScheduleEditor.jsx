import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCurrentUser } from '@/lib/store'
import { ChevronLeft } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function ScheduleEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const scheduleData = location.state?.scheduleData;
  
  const [periods, setPeriods] = React.useState(
    scheduleData?.periods || [
      { name: '', startTime: '', endTime: '' }
    ]
  );

  const handleAddPeriod = () => {
    setPeriods([...periods, { name: '', startTime: '', endTime: '' }]);
  };

  const handlePeriodChange = (index, field, value) => {
    const newPeriods = [...periods];
    newPeriods[index][field] = value;
    setPeriods(newPeriods);
  };

  const handleSave = () => {
    // TODO: Save the schedule
    console.log('Saving schedule:', periods);
    navigate(-1);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className='flex items-center gap-3 p-4 border-b bg-card'>
        <Button 
          variant="ghost"
          size="sm"
          className='h-8 w-8 p-0'
          onClick={() => navigate(-1)}
        >
          <ChevronLeft size={20} />
        </Button>
        {(() => {
          const user = useCurrentUser();
          const showTitle = user ? user.showPageTitles !== false : true;
          return (
            showTitle ? (
              <h1 className='text-2xl font-bold flex-1'>
                {scheduleData?.name || 'New Bell Schedule'}
              </h1>
            ) : (
              <div className='flex-1' />
            )
          )
        })()}
        <Button onClick={handleSave}>
          Save
        </Button>
      </div>

      <div className='flex-1 overflow-auto p-6'>
        <div className='bg-card rounded-lg border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period Name</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.map((period, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      placeholder={`Period ${index + 1}`}
                      value={period.name}
                      onChange={(e) => handlePeriodChange(index, 'name', e.target.value)}
                      className='h-9'
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder='Start Time'
                      value={period.startTime}
                      onChange={(e) => handlePeriodChange(index, 'startTime', e.target.value)}
                      className='h-9'
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder='End Time'
                      value={period.endTime}
                      onChange={(e) => handlePeriodChange(index, 'endTime', e.target.value)}
                      className='h-9'
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className='mt-6'>
          <Button variant="outline" className='w-full' onClick={handleAddPeriod}>
            Add Period
          </Button>
        </div>
      </div>
    </div>
  )
}
