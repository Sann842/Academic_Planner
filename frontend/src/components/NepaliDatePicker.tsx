import { useMemo, useState } from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getTodayBS,
  isToday,
  NEPALI_MONTHS_EN,
  NEPALI_DAYS_EN,
  formatBSDate,
} from "@/lib/nepaliCalendar";

interface NepaliDatePickerProps {
  /** Selected date as a "YYYY-MM-DD" BS string, or empty string for none */
  value: string;
  /** Called with a "YYYY-MM-DD" BS string when the user picks a day */
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
}

// Only years we have real BS calendar day-count data for (see nepaliCalendar.ts).
// This is the same range the backend's nepali_datetime library covers well.
const AVAILABLE_YEARS = [
  2080, 2081, 2082, 2083, 2084, 2085, 2086, 2087, 2088, 2089, 2090,
];

function parseValue(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

export function NepaliDatePicker({
  value,
  onChange,
  placeholder = "Select a date (BS)",
  id,
  disabled,
}: NepaliDatePickerProps) {
  const today = getTodayBS();
  const parsed = parseValue(value);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.year);
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.month);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayOfMonth = getFirstDayOfMonth(viewYear, viewMonth);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    return days;
  }, [daysInMonth, firstDayOfMonth]);

  const goToPreviousMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const selectDay = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(dateStr);
    setOpen(false);
  };

  const displayLabel = parsed
    ? formatBSDate(parsed.year, parsed.month, parsed.day)
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          title={parsed ? `${displayLabel} (${value})` : undefined}
          className={cn(
            "w-full justify-start text-left font-normal",
            !parsed && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{displayLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex gap-1 flex-1">
            <Select
              value={String(viewMonth)}
              onValueChange={(v) => setViewMonth(Number(v))}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {NEPALI_MONTHS_EN.map((name, i) => (
                  <SelectItem key={name} value={String(i + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={String(viewYear)}
              onValueChange={(v) => setViewYear(Number(v))}
            >
              <SelectTrigger className="h-8 text-xs w-[90px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AVAILABLE_YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={goToNextMonth}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {NEPALI_DAYS_EN.map((d, i) => (
            <div
              key={d}
              className={cn(
                "text-center text-[10px] font-medium py-1",
                i === 6 ? "text-primary" : "text-muted-foreground"
              )}
            >
              {d.slice(0, 2)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="aspect-square" />;
            }
            const isSelected =
              parsed &&
              parsed.year === viewYear &&
              parsed.month === viewMonth &&
              parsed.day === day;
            const isTodayDate = isToday(viewYear, viewMonth, day);

            return (
              <button
                key={day}
                type="button"
                onClick={() => selectDay(day)}
                className={cn(
                  "aspect-square rounded-md flex items-center justify-center text-xs transition-all",
                  "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring",
                  isSelected && "bg-primary text-primary-foreground font-semibold hover:bg-primary/90",
                  !isSelected && isTodayDate && "ring-1 ring-primary font-semibold"
                )}
              >
                {day}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}