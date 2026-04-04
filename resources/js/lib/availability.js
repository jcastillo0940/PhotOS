const DEFAULT_HOURS = { start: '09:00', end: '18:00', slot_minutes: 60 };
const DEFAULT_SETTINGS = { enforce_schedule: true, parallel_limit: 1 };

export function normalizeAvailabilitySettings(settings = {}) {
    return {
        enforce_schedule: settings?.enforce_schedule !== false,
        parallel_limit: Math.max(1, Number(settings?.parallel_limit || 1)),
    };
}

export function buildSlots(date, busyEvents = [], businessHours = DEFAULT_HOURS, availabilitySettings = DEFAULT_SETTINGS) {
    if (!date) return [];

    const rules = normalizeAvailabilitySettings(availabilitySettings);
    const [year, month, day] = date.split('-').map(Number);
    const [startHour, startMinute] = (businessHours?.start || DEFAULT_HOURS.start).split(':').map(Number);
    const [endHour, endMinute] = (businessHours?.end || DEFAULT_HOURS.end).split(':').map(Number);
    const slotMinutes = Number(businessHours?.slot_minutes || DEFAULT_HOURS.slot_minutes);

    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const overlaps = busyEvents.filter((event) => {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        return eventStart <= endOfDay && eventEnd >= startOfDay;
    });

    const slots = [];
    const cursor = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
    const closing = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

    while (cursor < closing) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor);
        slotEnd.setMinutes(slotEnd.getMinutes() + slotMinutes);

        const overlappingCount = overlaps.filter((event) => {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            return slotStart < eventEnd && slotEnd > eventStart;
        }).length;

        const isBusy = rules.enforce_schedule && overlappingCount >= rules.parallel_limit;

        if (!isBusy && slotEnd <= closing) {
            slots.push(slotStart.toTimeString().slice(0, 5));
        }

        cursor.setMinutes(cursor.getMinutes() + slotMinutes);
    }

    return slots;
}

export function isPastDate(date) {
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date + 'T00:00:00');

    return target < today;
}

export function isDateUnavailable(date, busyEvents = [], businessHours = DEFAULT_HOURS, availabilitySettings = DEFAULT_SETTINGS) {
    if (isPastDate(date)) {
        return true;
    }

    return buildSlots(date, busyEvents, businessHours, availabilitySettings).length === 0;
}

export function getMonthGrid(monthDate) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < startWeekday; i += 1) {
        cells.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
        const date = new Date(year, month, day);
        cells.push({ day, date, iso: toIsoDate(date) });
    }

    while (cells.length % 7 !== 0) {
        cells.push(null);
    }

    return cells;
}

export function toIsoDate(date) {
    const pad = (value) => String(value).padStart(2, '0');
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
}
