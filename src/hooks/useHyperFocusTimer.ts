import { useState, useEffect, useRef, useCallback } from "react";

export const DEFAULT_DURATION = 30 * 60; // 30 min fallback

/** Plays an elegant slow-decay "Tibetan bowl / reception bell" sound via Web Audio API */
export function playBellSound() {
    try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        const harmonics = [
            { freq: 440, gain: 0.5 },
            { freq: 880, gain: 0.3 },
            { freq: 1174, gain: 0.15 },
            { freq: 1760, gain: 0.08 },
        ];

        harmonics.forEach(({ freq, gain }) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 4);
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 4.1);
        });

        setTimeout(() => ctx.close(), 4500);
    } catch {
        // ignore
    }
}

/** Request browser notification permission if not yet granted */
export async function requestNotificationPermission() {
    if ("Notification" in window && Notification.permission === "default") {
        await Notification.requestPermission();
    }
}

function sendBrowserNotification(taskText: string) {
    if ("Notification" in window && Notification.permission === "granted") {
        new Notification("✅ Sesión completada", {
            body: `"${taskText}" — ¡Excelente trabajo!`,
            icon: "/favicon.ico",
            silent: false,
        });
    }
}

export interface UseHyperFocusTimerReturn {
    activeTaskId: string | null;
    secsLeft: number;
    isRunning: boolean;
    startTimer: (taskId: string, durationSecs?: number) => void;
    stopTimer: () => void;
    formatTime: (secs: number) => string;
}

export function useHyperFocusTimer(
    getTaskText: (taskId: string) => string
): UseHyperFocusTimerReturn {
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const [secsLeft, setSecsLeft] = useState(DEFAULT_DURATION);

    // Store wall-clock start time + total duration so we can calculate exactly
    // how much time remains even if the interval was throttled by the browser.
    const startTimeRef = useRef<number | null>(null);
    const totalDurationRef = useRef<number>(DEFAULT_DURATION);
    const activeTaskIdRef = useRef<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const getTaskTextRef = useRef(getTaskText);
    getTaskTextRef.current = getTaskText;

    const clearTimer = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const stopTimer = useCallback(() => {
        clearTimer();
        setActiveTaskId(null);
        activeTaskIdRef.current = null;
        startTimeRef.current = null;
        setSecsLeft(DEFAULT_DURATION);
    }, [clearTimer]);

    const startTimer = useCallback((taskId: string, durationSecs: number = DEFAULT_DURATION) => {
        clearTimer();

        requestNotificationPermission();

        const now = Date.now();
        startTimeRef.current = now;
        totalDurationRef.current = durationSecs;
        activeTaskIdRef.current = taskId;

        setActiveTaskId(taskId);
        setSecsLeft(durationSecs);

        // Use a short interval (500ms) so the displayed value stays accurate
        // even when the browser throttles the tab. What matters is Date.now().
        intervalRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
            const remaining = totalDurationRef.current - elapsed;

            if (remaining <= 0) {
                clearTimer();
                setSecsLeft(0);
                setActiveTaskId(null);
                activeTaskIdRef.current = null;
                startTimeRef.current = null;

                playBellSound();
                sendBrowserNotification(getTaskTextRef.current(taskId));
            } else {
                setSecsLeft(remaining);
            }
        }, 500); // tick every 500ms for accuracy; idempotent since we compute from wall clock
    }, [clearTimer]);

    // Also recalculate when the page becomes visible again (visibilitychange)
    useEffect(() => {
        const handleVisible = () => {
            if (startTimeRef.current === null || activeTaskIdRef.current === null) return;

            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const remaining = totalDurationRef.current - elapsed;

            if (remaining <= 0) {
                const taskId = activeTaskIdRef.current;
                clearTimer();
                setSecsLeft(0);
                setActiveTaskId(null);
                activeTaskIdRef.current = null;
                startTimeRef.current = null;
                playBellSound();
                sendBrowserNotification(getTaskTextRef.current(taskId));
            } else {
                setSecsLeft(remaining);
            }
        };

        document.addEventListener("visibilitychange", handleVisible);
        return () => document.removeEventListener("visibilitychange", handleVisible);
    }, [clearTimer]);

    // Cleanup on unmount
    useEffect(() => () => clearTimer(), [clearTimer]);

    const formatTime = (secs: number) => {
        const s = Math.max(0, secs);
        const m = Math.floor(s / 60).toString().padStart(2, "0");
        const sec = (s % 60).toString().padStart(2, "0");
        return `${m}:${sec}`;
    };

    return {
        activeTaskId,
        secsLeft,
        isRunning: activeTaskId !== null,
        startTimer,
        stopTimer,
        formatTime,
    };
}
