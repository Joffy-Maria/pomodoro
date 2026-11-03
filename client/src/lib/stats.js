const STATS_KEY = 'promate:stats:v1';
const NAME_KEY = 'promate:display-name';

const emptyStats = () => ({
    focusMinutes: 0,
    completedPomodoros: 0,
    history: [],
});

const canUseStorage = () => {
    try {
        return typeof window !== 'undefined' && !!window.localStorage;
    } catch {
        return false;
    }
};

export function getDisplayName() {
    if (!canUseStorage()) return '';
    try {
        return localStorage.getItem(NAME_KEY) || '';
    } catch {
        return '';
    }
}

export function setDisplayName(name) {
    if (!canUseStorage()) return;
    try {
        const trimmed = String(name || '').trim().slice(0, 24);
        if (trimmed) localStorage.setItem(NAME_KEY, trimmed);
        else localStorage.removeItem(NAME_KEY);
    } catch {
        /* ignore quota / privacy mode */
    }
}

export function getStats() {
    if (!canUseStorage()) return emptyStats();
    try {
        const raw = localStorage.getItem(STATS_KEY);
        if (!raw) return emptyStats();
        const parsed = JSON.parse(raw);
        return {
            ...emptyStats(),
            ...parsed,
            history: Array.isArray(parsed.history) ? parsed.history : [],
        };
    } catch {
        return emptyStats();
    }
}

function saveStats(stats) {
    if (!canUseStorage()) return;
    try {
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
        /* ignore quota / privacy mode */
    }
}

export function recordSessionStart({ roomId, mode = 'focus', durationMinutes = 25 }) {
    const stats = getStats();
    const entry = {
        id: `${Date.now()}-${roomId}`,
        roomId,
        mode,
        durationMinutes: Math.max(1, Math.round(durationMinutes)),
        startedAt: Date.now(),
        completed: false,
    };
    stats.history = [entry, ...stats.history].slice(0, 50);
    saveStats(stats);
    return stats;
}

export function recordFocusComplete({ roomId, minutes }) {
    const stats = getStats();
    const focused = Math.max(1, Math.round(minutes || 25));
    stats.focusMinutes += focused;
    stats.completedPomodoros += 1;

    const entry = stats.history.find((item) => item.roomId === roomId && !item.completed);
    if (entry) {
        entry.completed = true;
        entry.completedAt = Date.now();
        entry.durationMinutes = focused;
    } else {
        stats.history.unshift({
            id: `${Date.now()}-${roomId}`,
            roomId,
            mode: 'focus',
            durationMinutes: focused,
            startedAt: Date.now(),
            completedAt: Date.now(),
            completed: true,
        });
    }

    stats.history = stats.history.slice(0, 50);
    saveStats(stats);
    return stats;
}

export function getStreak(stats = getStats()) {
    const days = new Set(
        stats.history
            .filter((entry) => entry.completed && entry.completedAt)
            .map((entry) => new Date(entry.completedAt).toDateString())
    );

    if (days.size === 0) return 0;

    const cursor = new Date();
    // A streak stays alive if you focused today OR yesterday.
    if (!days.has(cursor.toDateString())) {
        cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;
    while (days.has(cursor.toDateString())) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

export function getWeeklyFocus(stats = getStats()) {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const days = [];

    for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() - offset);
        const key = date.toDateString();
        const minutes = stats.history
            .filter((entry) => entry.completed && entry.completedAt && new Date(entry.completedAt).toDateString() === key)
            .reduce((total, entry) => total + (entry.durationMinutes || 0), 0);

        days.push({ key, label: labels[date.getDay()], minutes, isToday: offset === 0 });
    }

    return days;
}

export function formatMinutes(minutes) {
    const value = Math.max(0, Math.round(minutes || 0));
    if (value < 60) return `${value}m`;
    const hours = Math.floor(value / 60);
    const remaining = value % 60;
    return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}
