import { describe, expect, it } from 'vitest';
import { calendarTimeZone, zonedCalendar } from './calendar-timezone';
describe('personal calendar timezone', () => {
  it('moves columns across midnight without changing event instants', () => {
    const at = Date.parse('2026-09-13T20:00:00Z');
    const india = zonedCalendar('Asia/Kolkata');
    expect(india.date(at).getUTCDate()).toBe(14);
    expect(india.minutes(at)).toBe(90);
    expect(india.offset(at)).toBe(330);
    expect(india.instant(india.wall(at))).toBe(at);
    expect(zonedCalendar('UTC').minutes(at)).toBe(1200);
  });
  it('keeps wall days and slot selection correct across DST', () => {
    const z = zonedCalendar('America/New_York');
    const start = z.start(Date.parse('2026-03-08T12:00:00Z'));
    expect(z.add(start, 1) - start).toBe(23 * 3600000);
    expect(z.instant(Date.UTC(2026,2,8,2,30))).toBe(Date.parse('2026-03-08T07:30:00Z'));
    expect(z.instant(Date.UTC(2026,10,1,1,30))).toBe(Date.parse('2026-11-01T05:30:00Z'));
    expect(z.slot(start, 180, 0, 60)).toBe(Date.parse('2026-03-08T07:00:00Z'));
  });
  it('handles fractional offsets and invalid saved preferences', () => {
    expect(zonedCalendar('Asia/Kathmandu').offset(Date.now())).toBe(345);
    expect(calendarTimeZone('not/a-zone')).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });
});


it("labels countries with flags and distinguishes their timezones", async () => {
  const { calendarTimeZoneOptions } = await import("./calendar-timezone");
  const options = calendarTimeZoneOptions("Asia/Kolkata");
  expect(options.filter(option => option.label === "🇮🇳 India")).toHaveLength(1);
  expect(options.find(option => option.value === "America/New_York")?.label).toBe("🇺🇸 United States · New York");
  expect(options.find(option => option.value === "UTC")?.label).toBe("🌐 UTC");
  expect(new Set(options.map(option => option.value)).size).toBe(options.length);
});
