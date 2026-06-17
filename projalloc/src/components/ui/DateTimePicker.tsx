import { useMemo, useState } from 'react'
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  setHours,
  setMinutes,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns'
import { cn, formatDateTime, fromDatetimeLocalValue } from '@/lib/utils'

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  className?: string
  compact?: boolean
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MINUTES = ['00', '15', '30', '45']

function parseValue(value: string): Date | null {
  if (!value) return null
  const parsed = parse(value, "yyyy-MM-dd'T'HH:mm", new Date())
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function toLocalValue(date: Date) {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 16)
}

function ChevronLeft() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function DateTimePicker({
  value,
  onChange,
  label,
  required,
  className,
  compact = false,
}: DateTimePickerProps) {
  const selected = parseValue(value)
  const [viewMonth, setViewMonth] = useState(() => selected ?? new Date())

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth))
    const end = endOfWeek(endOfMonth(viewMonth))
    return eachDayOfInterval({ start, end })
  }, [viewMonth])

  const hour12 = selected ? ((selected.getHours() % 12) || 12) : 9
  const minute = selected ? String(selected.getMinutes()).padStart(2, '0') : '00'
  const period = selected ? (selected.getHours() >= 12 ? 'PM' : 'AM') : 'AM'

  const updateDateTime = (date: Date) => {
    onChange(toLocalValue(date))
    setViewMonth(date)
  }

  const selectDay = (day: Date) => {
    const base = selected ?? setMinutes(setHours(new Date(), 9), 0)
    const next = setMinutes(
      setHours(day, base.getHours()),
      base.getMinutes(),
    )
    updateDateTime(next)
  }

  const selectTime = (nextHour12: number, nextMinute: string, nextPeriod: 'AM' | 'PM') => {
    const base = selected ?? setMinutes(setHours(new Date(), 9), 0)
    let hour24 = nextHour12 % 12
    if (nextPeriod === 'PM') hour24 += 12
    if (nextPeriod === 'AM' && nextHour12 === 12) hour24 = 0
    if (nextPeriod === 'PM' && nextHour12 === 12) hour24 = 12
    updateDateTime(setMinutes(setHours(base, hour24), Number(nextMinute)))
  }

  const applyPreset = (date: Date) => {
    updateDateTime(date)
  }

  const presets = [
    {
      label: 'Tomorrow 9 AM',
      date: setMinutes(setHours(addDays(new Date(), 1), 9), 0),
    },
    {
      label: 'In 3 days',
      date: setMinutes(setHours(addDays(new Date(), 3), 12), 0),
    },
    {
      label: 'In 1 week',
      date: setMinutes(setHours(addWeeks(new Date(), 1), 12), 0),
    },
    {
      label: 'Today 6 PM',
      date: setMinutes(setHours(new Date(), 18), 0),
    },
  ]

  if (compact) {
    const datePart = value.split('T')[0] ?? ''
    const hasTime = value.includes('T')

    return (
      <div className={cn('space-y-2', className)}>
        {label && (
          <label className="block text-sm text-text-secondary">{label}</label>
        )}

        <div className="rounded-xl border border-border bg-bg-elevated p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={datePart}
              onChange={(e) => {
                const nextDate = e.target.value
                if (!nextDate) {
                  onChange('')
                  return
                }
                const time = hasTime ? value.split('T')[1] : '09:00'
                onChange(`${nextDate}T${time}`)
              }}
              className="input-field input-field-focus min-w-[140px] flex-1 px-2 py-1.5 text-[13px]"
            />

            <select
              value={hour12}
              onChange={(e) =>
                selectTime(Number(e.target.value), minute, period as 'AM' | 'PM')
              }
              className="input-field input-field-focus w-14 px-1 py-1.5 text-center text-[13px]"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>

            <span className="text-text-muted">:</span>

            <select
              value={minute}
              onChange={(e) =>
                selectTime(hour12, e.target.value, period as 'AM' | 'PM')
              }
              className="input-field input-field-focus w-14 px-1 py-1.5 text-center text-[13px]"
            >
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <div className="flex gap-1">
              {(['AM', 'PM'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => selectTime(hour12, minute, p)}
                  className={cn(
                    'rounded-lg border px-2.5 py-1.5 text-[12px] font-display font-semibold transition-all duration-200 active:scale-[0.97]',
                    period === p
                      ? 'border-accent bg-accent/8 text-accent shadow-[0_0_12px_var(--accent-glow)]'
                      : 'border-border text-text-secondary hover:border-accent/30',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-1.5">
            {presets.map(({ label: presetLabel, date }) => (
              <button
                key={presetLabel}
                type="button"
                onClick={() => applyPreset(date)}
                className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-text-secondary transition-colors hover:border-accent/40 hover:text-accent"
              >
                {presetLabel}
              </button>
            ))}
          </div>

          <p className="mt-2 text-[12px] text-text-muted">
            {selected ? (
              <>
                Selected:{' '}
                <span className="text-text-primary">
                  {formatDateTime(fromDatetimeLocalValue(value))}
                </span>
              </>
            ) : (
              'Pick a date and time'
            )}
          </p>
        </div>

        <input
          type="text"
          value={value}
          onChange={() => {}}
          required={required}
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-0 w-0 opacity-0"
        />
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      {label && (
        <label className="block text-sm text-text-secondary">{label}</label>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-bg-elevated">
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-[1fr_220px] md:divide-x md:divide-y-0">
          {/* Calendar */}
          <div className="min-w-0 p-3 sm:p-4">
            <div className="mb-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMonth(subMonths(viewMonth, 1))}
                className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
                aria-label="Previous month"
              >
                <ChevronLeft />
              </button>
              <span className="text-[14px] font-medium text-text-primary">
                {format(viewMonth, 'MMMM yyyy')}
              </span>
              <button
                type="button"
                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-bg-surface hover:text-text-primary"
                aria-label="Next month"
              >
                <ChevronRight />
              </button>
            </div>

            <div className="mb-2 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[11px] font-medium uppercase tracking-wide text-text-muted"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const inMonth = isSameMonth(day, viewMonth)
                const isSelected = selected ? isSameDay(day, selected) : false
                const today = isToday(day)

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={cn(
                      'aspect-square rounded-lg text-[13px] font-display font-semibold transition-all duration-200 active:scale-[0.95]',
                      !inMonth && 'text-text-muted/40',
                      inMonth && !isSelected && 'text-text-secondary hover:bg-bg-surface hover:text-text-primary',
                      isSelected && 'bg-accent text-black shadow-accent-glow',
                      today && !isSelected && 'ring-1 ring-accent/40',
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Time */}
          <div className="flex flex-col p-3 sm:p-4 md:min-w-[220px]">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-widest text-text-muted">
              Time
            </p>

            <div className="flex items-center gap-2">
              <select
                value={hour12}
                onChange={(e) =>
                  selectTime(Number(e.target.value), minute, period as 'AM' | 'PM')
                }
                className="input-field input-field-focus flex-1 px-2 py-2 text-center text-[14px]"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
              <span className="text-text-muted">:</span>
              <select
                value={minute}
                onChange={(e) =>
                  selectTime(hour12, e.target.value, period as 'AM' | 'PM')
                }
                className="input-field input-field-focus w-16 px-2 py-2 text-center text-[14px]"
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {(['AM', 'PM'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => selectTime(hour12, minute, p)}
                  className={cn(
                    'rounded-lg border py-2 text-[13px] font-display font-semibold transition-all duration-200 active:scale-[0.97]',
                    period === p
                      ? 'border-accent bg-accent/8 text-accent shadow-[0_0_12px_var(--accent-glow)]'
                      : 'border-border text-text-secondary hover:border-accent/30 hover:text-text-primary',
                  )}
                >
                  {p}
                </button>
              ))}
            </div>

            <p className="mt-auto pt-4 text-[11px] leading-relaxed text-text-muted">
              Pick a day on the calendar, then set the hour and minute.
            </p>
          </div>
        </div>

        {/* Presets + summary */}
        <div className="border-t border-border bg-bg-surface px-3 py-3 sm:px-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {presets.map(({ label: presetLabel, date }) => (
              <button
                key={presetLabel}
                type="button"
                onClick={() => applyPreset(date)}
                className="rounded-full border border-border px-3 py-1 text-[12px] text-text-secondary transition-colors hover:border-accent/40 hover:text-accent"
              >
                {presetLabel}
              </button>
            ))}
          </div>

          <p className="text-[13px] text-text-secondary">
            {selected ? (
              <>
                Selected:{' '}
                <span className="font-medium text-text-primary">
                  {formatDateTime(fromDatetimeLocalValue(value))}
                </span>
              </>
            ) : (
              'No date selected yet'
            )}
          </p>
        </div>
      </div>

      {/* Hidden input for form validation */}
      <input
        type="text"
        value={value}
        onChange={() => {}}
        required={required}
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />
    </div>
  )
}
