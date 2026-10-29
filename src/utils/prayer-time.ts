import {
  addDays,
  prayerNames,
  prayerTimetableByDate,
  prayerTimetableMeta,
  type PrayerDay,
  type PrayerName,
} from "../data/prayer-times";

interface ZonedParts {
  date: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface PrayerMoment {
  date: string;
  name: PrayerName;
  time: string;
  epoch: number;
}

export interface PrayerState {
  date: string;
  day: PrayerDay;
  current: PrayerMoment | null;
  next: PrayerMoment | null;
}

const partsFormatter = new Intl.DateTimeFormat("en-IE", {
  timeZone: prayerTimetableMeta.timezone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function getDublinParts(date: Date): ZonedParts {
  const values = Object.fromEntries(
    partsFormatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    year,
    month,
    day,
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

export function zonedDateTimeToEpoch(date: string, time: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = targetAsUtc;

  for (let index = 0; index < 3; index += 1) {
    const represented = getDublinParts(new Date(candidate));
    const representedAsUtc = Date.UTC(
      represented.year,
      represented.month - 1,
      represented.day,
      represented.hour,
      represented.minute,
      represented.second,
    );
    candidate += targetAsUtc - representedAsUtc;
  }

  return candidate;
}

function getPrayerMoments(day: PrayerDay): PrayerMoment[] {
  return prayerNames.map((name) => ({
    date: day.date,
    name,
    time: day[name],
    epoch: zonedDateTimeToEpoch(day.date, day[name]),
  }));
}

export function getPrayerState(now = new Date()): PrayerState | null {
  const { date } = getDublinParts(now);
  const day = prayerTimetableByDate.get(date);
  if (!day) return null;

  const moments = getPrayerMoments(day);
  const nextIndex = moments.findIndex((moment) => moment.epoch > now.getTime());
  let current: PrayerMoment | null = null;
  let next: PrayerMoment | null = null;

  if (nextIndex === 0) {
    const previousDate = addDays(date, -1);
    const previousDay = prayerTimetableByDate.get(previousDate);
    if (previousDay) {
      current = getPrayerMoments(previousDay).at(-1) ?? null;
    }
    next = moments[0] ?? null;
  } else if (nextIndex > 0) {
    current = moments[nextIndex - 1] ?? null;
    next = moments[nextIndex] ?? null;
  } else {
    current = moments.at(-1) ?? null;
    const tomorrowDate = addDays(date, 1);
    const tomorrow = prayerTimetableByDate.get(tomorrowDate);
    if (tomorrow) {
      next = getPrayerMoments(tomorrow)[0] ?? null;
    }
  }

  return { date, day, current, next };
}

export function formatCountdown(milliseconds: number): string {
  if (milliseconds <= 0) return "now";

  const totalMinutes = Math.floor(milliseconds / 60_000);
  if (totalMinutes < 1) return "in under a minute";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `in ${minutes} min`;
  if (minutes === 0) return `in ${hours} hr`;
  return `in ${hours} hr ${minutes} min`;
}
