const RECENT_KEY = 'phishintel:recent';
const PREFIX = 'phishintel:result:';
function getRecentList() {
    try {
        const raw = localStorage.getItem(RECENT_KEY);
        const list = raw ? JSON.parse(raw) : [];
        return Array.isArray(list) ? list : [];
    }
    catch {
        return [];
    }
}
function setRecentList(list) {
    try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 10)));
    }
    catch { }
}
export function saveResult(result) {
    try {
        localStorage.setItem(PREFIX + result.uuid, JSON.stringify(result));
        const list = getRecentList().filter(id => id !== result.uuid);
        list.unshift(result.uuid);
        setRecentList(list);
    }
    catch { }
}
export function getCached(uuid) {
    try {
        const raw = localStorage.getItem(PREFIX + uuid);
        return raw ? JSON.parse(raw) : null;
    }
    catch {
        return null;
    }
}
export function getRecent(n = 5) {
    return getRecentList().slice(0, n).map((id) => {
        const cached = getCached(id);
        return { uuid: id, verdict: cached?.verdict || 'Safe', submitted: cached?.submitted || '' };
    });
}
