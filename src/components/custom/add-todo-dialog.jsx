import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AddTodoDialog({ open, onOpenChange }) {
  const { addTodo } = useStore();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(null);
  const [time, setTime] = useState('12:00');

  const handleAddTodo = () => {
    if (!title.trim()) return;

    let finalDueDate = null;
    if (dueDate) {
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date(dueDate);
      date.setHours(hours, minutes, 0, 0);
      finalDueDate = date;
    }

    addTodo({
      title: title.trim(),
      dueDate: finalDueDate,
      completed: false,
    });

    setTitle('');
    setDueDate(null);
    setTime('12:00');
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen) => {
    if (!newOpen) {
      // Reset form when closing
      setTitle('');
      setDueDate(null);
      setTime('12:00');
    }
    onOpenChange(newOpen);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96 px-6 py-6">
        <SheetHeader>
          <SheetTitle>Add New Todo</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="todo-title">Title</Label>
            <Input
              id="todo-title"
              placeholder="Enter todo title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTodo();
                }
              }}
              autoFocus
            />
          </div>

          <div className="space-y-1">
            <Label>Due Date & Time <p className='text-xs text-muted-foreground'>Optional</p></Label>
            <div className="space-y-2">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !dueDate && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate
                          ? dueDate.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: '2-digit',
                            })
                          : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {dueDate && (
                  <div className="flex-1">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {dueDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDueDate(null)}
                  className="w-full text-muted-foreground"
                >
                  Clear Date
                </Button>
              )}
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddTodo} disabled={!title.trim()}>
            Add Todo
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
