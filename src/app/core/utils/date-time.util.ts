export function localDayBoundsToUtc(date: string, timezone: string): { dayStartUtc: string; dayEndUtc: string } {
  const offsetMs = getUtcOffsetMs(date, timezone);
  const dayStartUtc = new Date(new Date(`${date}T00:00:00Z`).getTime() - offsetMs);
  const dayEndUtc = new Date(dayStartUtc.getTime() + 24 * 60 * 60 * 1000);
  return { dayStartUtc: dayStartUtc.toISOString(), dayEndUtc: dayEndUtc.toISOString() };
}

export function localDateTimeToUtc(date: string, time: string, timezone: string): string {
  const offsetMs = getUtcOffsetMs(date, timezone);
  const naiveUtc = new Date(`${date}T${time}:00Z`);
  return new Date(naiveUtc.getTime() - offsetMs).toISOString();
}

export function formatLocalTime(isoUtc: string, timezone: string): string {
  return new Date(isoUtc).toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', timeZone: timezone
  });
}

export function formatLocalTimeInputValue(isoUtc: string, timezone: string): string {
  return new Date(isoUtc).toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: timezone
  });
}

function getUtcOffsetMs(date: string, timezone: string): number {
  const probe = new Date(`${date}T00:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(probe);

  const get = (type: string) => parts.find(p => p.type === type)!.value;
  const localAtProbe = new Date(Date.UTC(
    +get('year'), +get('month') - 1, +get('day'),
    +get('hour'), +get('minute'), +get('second')
  ));
  return localAtProbe.getTime() - probe.getTime();
}
