/* Slot generation — turns provider availability + visit duration into
   real bookable times. Shared by the patient preview and the patient app. */

import { DAYS } from '../data/initialData';

export const toMinutes = (hhmm) => {
  const [h, m] = (hhmm || '0:0').split(':').map(Number);
  return (h * 60) + (m || 0);
};

export const fromMinutes = (mins) => {
  const h24 = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
};

export const durationMinutes = (duration) => {
  const n = parseInt(String(duration || '30'), 10);
  return Number.isFinite(n) && n > 0 ? n : 30;
};

/** Providers who can deliver this visit option in this room. */
export function providersForVisit(clinic, room, visit) {
  const all = clinic?.providers || [];
  const inRoom = all.filter(p => !p.roomIds?.length || p.roomIds.includes(room?.id));
  if (visit?.providerIds?.length) {
    return inRoom.filter(p => visit.providerIds.includes(p.id));
  }
  return inRoom;
}

/**
 * Bookable slots for one provider on one date.
 * Returns [{ time, minutes, providerId, providerName }].
 */
function providerSlots(provider, date, durMins) {
  const dayName = DAYS[date.getDay()];
  const windows = provider.availability?.[dayName] || [];
  const out = [];
  for (const w of windows) {
    const start = toMinutes(w.start);
    const end = toMinutes(w.end);
    for (let t = start; t + durMins <= end; t += durMins) {
      out.push({
        time: fromMinutes(t),
        minutes: t,
        providerId: provider.id,
        providerName: `${provider.name}${provider.credential ? ', ' + provider.credential : ''}`,
      });
    }
  }
  return out;
}

/**
 * Merged slots across every eligible provider for a date.
 * Same clock time from multiple providers collapses into one slot that
 * records how many providers are free then.
 */
export function slotsForDate({ clinic, room, visit, date }) {
  const providers = providersForVisit(clinic, room, visit);
  const durMins = durationMinutes(visit?.duration);
  const byTime = new Map();

  for (const p of providers) {
    for (const s of providerSlots(p, date, durMins)) {
      const existing = byTime.get(s.minutes);
      if (existing) {
        existing.providerNames.push(s.providerName);
      } else {
        byTime.set(s.minutes, { ...s, providerNames: [s.providerName] });
      }
    }
  }

  return [...byTime.values()].sort((a, b) => a.minutes - b.minutes);
}

/** Next `count` dates from tomorrow that have at least one slot. */
export function upcomingDates({ clinic, room, visit, count = 7, from = new Date() }) {
  const out = [];
  const cursor = new Date(from);
  for (let i = 0; i < 30 && out.length < count; i++) {
    cursor.setDate(cursor.getDate() + 1);
    const d = new Date(cursor);
    out.push({ date: d, slotCount: slotsForDate({ clinic, room, visit, date: d }).length });
  }
  return out;
}
