import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function Calendar({ initialMonth = new Date().getMonth(), initialYear = new Date().getFullYear(), events = {}, loading = false, onMonthChange = null }) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
  };

  const getEventsForDate = (day, monthVal, yearVal, isCurrentMonth) => {
    if (!isCurrentMonth) return [];
    const fullYearString = `${monthVal + 1}/${day}/${yearVal}`;
    const twoDigitYear = `${monthVal + 1}/${day}/${yearVal % 100}`;
    return events[fullYearString] || events[twoDigitYear] || [];
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getCalendarDays = () => {
    const firstDay = firstDayOfMonth(new Date(year, month));
    const daysInCurrentMonth = daysInMonth(new Date(year, month));
    const daysInPreviousMonth = daysInMonth(new Date(year, month - 1));

    const days = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: daysInPreviousMonth - i,
        isCurrentMonth: false,
        isPreviousMonth: true,
      });
    }

    for (let i = 1; i <= daysInCurrentMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        isPreviousMonth: false,
      });
    }

    const remainingDays = 42 - days.length; 
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        isPreviousMonth: false,
      });
    }

    return days;
  };

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
      if (onMonthChange) onMonthChange(11, year - 1);
    } else {
      setMonth(month - 1);
      if (onMonthChange) onMonthChange(month - 1, year);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
      if (onMonthChange) onMonthChange(0, year + 1);
    } else {
      setMonth(month + 1);
      if (onMonthChange) onMonthChange(month + 1, year);
    }
  };

  const calendarDays = getCalendarDays();

  return (
    <div className='bg-card rounded-xl p-0 border flex flex-col align-center w-full h-full'>
      <div className='flex items-center p-2'>
        <Button variant="outline" className='h-8 w-8' onClick={handlePrevMonth}>
          <ChevronLeft />
        </Button>
        <div className='flex-1 text-center font-medium text-xl'>
          {monthNames[month]} {year}
        </div>
        <Button variant="outline" className='h-8 w-8' onClick={handleNextMonth}>
          <ChevronRight />
        </Button>
      </div>

      <div className='flex text-muted-foreground w-full text-center font-normal border-b pb-1'>
        <div className='flex-1'>Sun</div>
        <div className='flex-1'>Mon</div>
        <div className='flex-1'>Tue</div>
        <div className='flex-1'>Wed</div>
        <div className='flex-1'>Thu</div>
        <div className='flex-1'>Fri</div>
        <div className='flex-1'>Sat</div>
      </div>

      <div className='grid grid-cols-7 gap-0 p-0 flex-1 min-h-0 relative' style={{ gridAutoRows: '1fr' }}>
        {loading && (
          <div className='absolute inset-0 bg-background/85 flex items-center justify-center z-50 rounded-b-xl'>
            <Spinner className='size-8' />
          </div>
        )}
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDate(day.date, month, year, day.isCurrentMonth);
          const today = new Date();
          const isToday = day.isCurrentMonth && day.date === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
          <div
            key={index}
            className={`p-1 flex overflow-y-auto hover:bg-accent/50 cursor-pointer border-r border-b transition-colors flex-col min-h-0 ${
              !day.isCurrentMonth ? 'text-muted-foreground/40 bg-muted/20' : ''
            }`}
            style={{
              borderRight: (index + 1) % 7 === 0 ? 'none' : undefined,
              borderBottom: index >= 35 ? 'none' : undefined,
            }}
          >
            <span className={`text-sm font-medium mb-1 ml-1 mt-0 ${isToday ? 'underline decoration-2 underline-offset-2' : ''}`}>{day.date}</span>
            <div className="events space-y-1 min-h-0">
                {dayEvents.length > 0 ? (
                  dayEvents.map((evt, idx) => (
                    <Tooltip key={idx}>
                      <TooltipTrigger asChild>
                        <div
                          className="rounded-sm text-xs px-1 truncate cursor-help"
                          style={{
                            backgroundColor: `rgba(${hexToRgb(evt.color)}, 0.2)`,
                            color: `color-mix(in srgb, ${evt.color} 60%, black 40%)`,
                          }}
                        >
                          {evt.event}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        {evt.event}
                      </TooltipContent>
                    </Tooltip>
                  ))
                ) : null}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
