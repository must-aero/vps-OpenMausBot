import { zonedCalendar } from "@/lib/calendar-timezone";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

function startOfMonth(value: number | Date) {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}
function sameDay(left: Date, right: Date) {
  return (
    left.getUTCFullYear() === right.getUTCFullYear() &&
    left.getUTCMonth() === right.getUTCMonth() &&
    left.getUTCDate() === right.getUTCDate()
  );
}

function moveMonth(date: Date, offset: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + offset, 1));
}

export interface MiniMonthProps {
  anchor: number;
  timeZone?: string;
  onSelect: (at: number) => void;
}

/** A compact, Monday-first month picker for the calendar sidebar. */
export function MiniMonth({ anchor, onSelect, timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone }: MiniMonthProps) {
  const zone = useMemo(() => zonedCalendar(timeZone), [timeZone]);
  const wallAnchor = zone.wall(anchor);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(wallAnchor));

  useEffect(() => {
    setVisibleMonth(startOfMonth(wallAnchor));
  }, [wallAnchor]);

  const days = useMemo(() => {
    const first = startOfMonth(visibleMonth);
    const mondayOffset = (first.getUTCDay() + 6) % 7;
    const gridStart = new Date(first);
    gridStart.setUTCDate(first.getUTCDate() - mondayOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setUTCDate(gridStart.getUTCDate() + index);
      return date;
    });
  }, [visibleMonth]);

  const selected = zone.date(anchor);
  const today = zone.date(Date.now());
  const monthLabel = visibleMonth.toLocaleDateString(undefined, { timeZone: "UTC",
    month: "long",
    year: "numeric",
  });

  return (
    <section aria-label="Mini calendar" className="select-none px-3 py-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="text-[12.5px] font-semibold text-ink">{monthLabel}</div>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setVisibleMonth((month) => moveMonth(month, -1))}
            className="flex size-7 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-raised hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            aria-label="Previous month"
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setVisibleMonth((month) => moveMonth(month, 1))}
            className="flex size-7 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-raised hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            aria-label="Next month"
          >
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7" aria-hidden="true">
        {WEEKDAY_LABELS.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className="flex h-6 items-center justify-center text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-secondary/75"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((date) => {
          const isSelected = sameDay(date, selected);
          const isToday = sameDay(date, today);
          const isOutsideMonth = date.getUTCMonth() !== visibleMonth.getUTCMonth();
          const label = date.toLocaleDateString(undefined, { timeZone: "UTC",
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          });

          return (
            <button
              key={`${date.getUTCFullYear()}-${date.getUTCMonth()}-${date.getUTCDate()}`}
              type="button"
              onClick={() => onSelect(zone.instant(date.getTime()))}
              aria-label={label}
              aria-current={isToday ? "date" : undefined}
              aria-pressed={isSelected}
              className="group flex h-7 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full text-[10.5px] transition-colors ${
                  isSelected
                    ? "bg-accent font-semibold text-white shadow-sm"
                    : isToday
                      ? "font-semibold text-accent group-hover:bg-accent/12"
                      : isOutsideMonth
                        ? "text-ink-secondary/35 group-hover:bg-raised group-hover:text-ink-secondary"
                        : "text-ink-secondary group-hover:bg-raised group-hover:text-ink"
                }`}
              >
                {date.getUTCDate()}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
