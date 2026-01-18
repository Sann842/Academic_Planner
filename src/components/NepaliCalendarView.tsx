import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  getTodayBS,
  getDaysInMonth,
  getFirstDayOfMonth,
  isToday,
  NEPALI_MONTHS,
  NEPALI_MONTHS_EN,
  NEPALI_DAYS,
  NEPALI_DAYS_EN,
} from "@/lib/nepaliCalendar";
import { Holiday, Event } from "@/lib/api";

interface NepaliCalendarViewProps {
  holidays?: Holiday[];
  events?: Event[];
  onDateSelect?: (year: number, month: number, day: number) => void;
  compact?: boolean;
}

export function NepaliCalendarView({
  holidays = [],
  events = [],
  onDateSelect,
  compact = false,
}: NepaliCalendarViewProps) {
  const today = getTodayBS();
  const [currentYear, setCurrentYear] = useState(today.year);
  const [currentMonth, setCurrentMonth] = useState(today.month);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  const getHolidaysForDay = (day: number): Holiday[] => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return holidays.filter((h) => h.date_bs === dateStr);
  };

  const getEventsForDay = (day: number): Event[] => {
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.date_bs === dateStr);
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentYear(today.year);
    setCurrentMonth(today.month);
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="gradient-primary p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center">
            <h2 className="text-lg md:text-xl font-bold text-primary-foreground">
              {NEPALI_MONTHS[currentMonth - 1]} {currentYear}
            </h2>
            <p className="text-xs text-primary-foreground/70">
              {NEPALI_MONTHS_EN[currentMonth - 1]}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
            className="text-primary-foreground hover:bg-primary-foreground/20 h-8 w-8"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={goToToday}
          className="mx-auto mt-2 text-xs text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/20"
        >
          <Calendar className="w-3 h-3 mr-1" />
          आज
        </Button>
      </CardHeader>

      <CardContent className="p-2 md:p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {(compact ? NEPALI_DAYS_EN : NEPALI_DAYS).map((day, index) => (
            <div
              key={day}
              className={cn(
                "text-center text-xs font-medium py-2",
                index === 6 ? "text-primary" : "text-muted-foreground"
              )}
            >
              {compact ? day.slice(0, 2) : day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }

            const dayHolidays = getHolidaysForDay(day);
            const dayEvents = getEventsForDay(day);
            const isTodayDate = isToday(currentYear, currentMonth, day);
            const hasPublicHoliday = dayHolidays.some((h) => h.is_public);
            const isSaturday = (firstDayOfMonth + day - 1) % 7 === 6;

            return (
              <button
                key={day}
                onClick={() => onDateSelect?.(currentYear, currentMonth, day)}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center text-sm relative transition-all",
                  "hover:bg-muted/80 focus:outline-none focus:ring-2 focus:ring-ring",
                  isTodayDate && "ring-2 ring-primary bg-primary/10 font-bold",
                  hasPublicHoliday && "bg-primary/20",
                  isSaturday && "text-primary",
                  !isTodayDate && !hasPublicHoliday && "hover:bg-muted"
                )}
              >
                <span className={cn(
                  "text-sm md:text-base",
                  isTodayDate && "text-primary font-bold"
                )}>
                  {day}
                </span>
                
                {/* Indicators */}
                <div className="flex gap-0.5 mt-0.5">
                  {dayHolidays.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                  )}
                  {dayEvents.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-secondary" />
            <span>Holiday</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span>Event</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full ring-2 ring-primary bg-primary/20" />
            <span>Today</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
