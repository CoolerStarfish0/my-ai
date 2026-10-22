import { getApps } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const BACKEND_URL = "https://5158-ai-backendpriv.vercel.app";
const OWNER_UID = "aa6pyqU8TsdWsrKsIdGmhlN2ycm1";
const FEATURE_LABELS = {
    chat: "Axon Chat",
    games: "Games Hub",
    "market-day": "Market Day",
    calendar: "Calendar",
    "work-mode": "Work Mode",
    "shared-chats": "Shared Chats"
};
const FEATURE_ICONS = {
    chat: "💬",
    games: "🎮",
    "market-day": "📈",
    calendar: "📅",
    "work-mode": "🛠️",
    "shared-chats": "👥"
};

function getCurrentUser() {
    const app = getApps()[0];
    return app ? getAuth(app).currentUser : null;
}

// Counts a feature once per browser tab session. No message text, email, UID,
// IP address, or other account identifier is sent with the event.
export function trackFeature(feature) {
    if (!Object.hasOwn(FEATURE_LABELS, feature)) return;
    const key = "axon_feature_seen_v1_" + feature;
    try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, "1");
    } catch {
        // If session storage is blocked, keep analytics best-effort.
    }
    fetch(BACKEND_URL + "/api/visitors?mode=feature-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature }),
        keepalive: true
    }).catch(() => {});
}

export async function loadFeatureAnalytics() {
    const status = document.getElementById("featureAnalyticsStatus");
    const list = document.getElementById("featureAnalyticsList");
    const chart = document.getElementById("featureAnalyticsChart");
    if (!status || !list || !chart) return;

    const user = getCurrentUser();
    if (!user || user.isAnonymous || user.uid !== OWNER_UID) {
        status.textContent = "Owner access required.";
        list.replaceChildren();
        chart.replaceChildren();
        return;
    }

    status.textContent = "Loading feature usage…";
    list.replaceChildren();
    chart.replaceChildren();
    try {
        const token = await user.getIdToken();
        const response = await fetch(BACKEND_URL + "/api/visitors?mode=feature-analytics", {
            headers: { Authorization: "Bearer " + token },
            cache: "no-store"
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load feature analytics.");

        const ranked = Object.entries(FEATURE_LABELS)
            .map(([key, label]) => ({ key, label, count: Number(data.totals?.[key]) || 0 }))
            .sort((a, b) => b.count - a.count);
        const max = Math.max(1, ...ranked.map(item => item.count));
        for (const item of ranked) {
            const row = document.createElement("article");
            row.className = "feature-analytics-row";
            const heading = document.createElement("div");
            heading.className = "feature-analytics-row-heading";
            const name = document.createElement("strong");
            name.textContent = (FEATURE_ICONS[item.key] || "•") + " " + item.label;
            const count = document.createElement("span");
            count.textContent = item.count.toLocaleString();
            heading.append(name, count);
            const track = document.createElement("div");
            track.className = "feature-analytics-bar-track";
            const bar = document.createElement("div");
            bar.className = "feature-analytics-bar";
            bar.style.width = ((item.count / max) * 100) + "%";
            track.append(bar);
            row.append(heading, track);
            list.append(row);
        }

        const days = Array.isArray(data.days) ? data.days : [];
        const recent = days.slice(-14);
        const maxDay = Math.max(1, ...recent.map(day =>
            Object.values(day.counts || {}).reduce((sum, value) => sum + (Number(value) || 0), 0)
        ));
        for (const day of recent) {
            const total = Object.values(day.counts || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
            const column = document.createElement("div");
            column.className = "feature-analytics-day";
            column.title = day.day + ": " + total + " feature launches";
            const bar = document.createElement("div");
            bar.className = "feature-analytics-day-bar";
            bar.style.height = Math.max(3, (total / maxDay) * 100) + "%";
            const label = document.createElement("span");
            label.textContent = String(day.day || "").slice(5);
            column.append(bar, label);
            chart.append(column);
        }
        const totalUses = Object.values(data.totals || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
        status.textContent = totalUses.toLocaleString() + " recorded feature launches across the last " + days.length + " day(s). Counts are approximate and deduplicated per feature per browser tab session.";
    } catch (error) {
        status.textContent = error.message || "Feature analytics are currently unavailable.";
    }
}


document.addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    if (target.closest("#gamesButton")) trackFeature("games");
    if (target.closest("#calendarButton")) trackFeature("calendar");
    if (target.closest("#workModeStartButton")) trackFeature("work-mode");
    if (target.closest("#inviteToChatButton, #sharedChatsButton")) trackFeature("shared-chats");
    const gameCard = target.closest("[data-game]");
    if (gameCard) {
        if (gameCard.dataset.game === "market") trackFeature("market-day");
        else trackFeature("games");
    }
});
