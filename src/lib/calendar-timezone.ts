import countries from "./calendar-timezone-countries.json";

/** Calendar presentation only: persisted schedules keep their original instants. */
export function calendarTimeZone(value: string): string {
  try { return new Intl.DateTimeFormat('en', { timeZone: value }).resolvedOptions().timeZone; }
  catch { return Intl.DateTimeFormat().resolvedOptions().timeZone; }
}

export function zonedCalendar(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const wall = (at: number) => {
    const p = Object.fromEntries(parts.formatToParts(at).map(p => [p.type, p.value]));
    return Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour!, +p.minute!, +p.second!);
  };
  // Resolve the displayed wall time across offset changes. Repeated times choose
  // the first occurrence; missing spring-forward times move forward by the gap.
  const instant = (wanted: number) => {
    const offsets = new Set([-36, 0, 36].map(h => { const at = wanted + h * 3600000; return wall(at) - at; }));
    const candidates = [...offsets].map(offset => wanted - offset).sort((a, b) => a - b);
    return candidates.find(at => wall(at) === wanted)
      ?? candidates.filter(at => wall(at) > wanted).sort((a, b) => wall(a) - wall(b))[0]!;
  };
  const date = (at: number) => new Date(wall(at));
  const start = (at: number) => { const d = date(at); return instant(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); };
  const add = (at: number, days: number) => { const d = date(at); d.setUTCDate(d.getUTCDate() + days); return instant(+d); };
  return {
    wall, instant, date, start, add,
    week: (at: number) => add(start(at), -((date(at).getUTCDay() + 6) % 7)),
    minutes: (at: number) => { const d = date(at); return d.getUTCHours() * 60 + d.getUTCMinutes(); },
    slot: (day: number, y: number, top: number, height: number) => {
      const minutes = Math.max(0, Math.min(1435, Math.round(((y - top) / height) * 12) * 5));
      const d = date(day); d.setUTCHours(0, minutes, 0, 0); return instant(+d);
    },
    time: (at: number) => new Date(at).toLocaleTimeString([], { timeZone, hour: 'numeric', minute: '2-digit' }),
    label: (at: number) => new Date(at).toLocaleDateString([], { timeZone, weekday: 'long', month: 'long', day: 'numeric' }),
    range: (at: number, days: number) => new Intl.DateTimeFormat([], { timeZone, month: 'short', day: 'numeric', year: 'numeric' }).formatRange(at, add(at, days - 1)),
    offset: (at: number) => (wall(at) - Math.floor(at / 1000) * 1000) / 60000,
  };
}

/** Country names from public-domain IANA zone.tab; cities distinguish timezones. */
export function calendarTimeZoneOptions(current: string) {
  const values = [...new Set(["UTC", current, ...Intl.supportedValuesOf("timeZone")].map(calendarTimeZone))];
  const regions = new Intl.DisplayNames(["en"], { type: "region" });
  const country = (value: string) => (countries as Record<string, string>)[value];
  return values.map(value => {
    const code = country(value);
    const city = value.split("/").slice(1).join(" · ").replaceAll("_", " ");
    if (!code) return { value, label: `🌐 ${city || value}` };
    const flag = String.fromCodePoint(...[...code].map(c => 127397 + c.charCodeAt(0)));
    const multiple = values.some(other => other !== value && country(other) === code);
    return { value, label: `${flag} ${regions.of(code)}${multiple ? ` · ${city}` : ""}` };
  }).sort((a, b) => a.label.localeCompare(b.label));
}
