"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, Clock } from "lucide-react";
import { MacroObjective } from "@/types";

interface Alert {
    id: string;
    type: "today" | "tomorrow";
    name: string;
    kind: "tarea" | "objetivo";
}

interface DueDateAlertsProps {
    objectives: MacroObjective[];
}

export default function DueDateAlerts({ objectives }: DueDateAlertsProps) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    const buildAlerts = useCallback(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const found: Alert[] = [];

        for (const obj of objectives) {
            // Check objective due date
            if (obj.dueDate) {
                const due = new Date(obj.dueDate);
                const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                const isCompleted = obj.tasks.length > 0 && obj.tasks.every(t => t.completed);
                if (!isCompleted) {
                    if (dueDay.getTime() === today.getTime()) {
                        found.push({ id: `obj-${obj.id}-today`, type: "today", name: obj.title, kind: "objetivo" });
                    } else if (dueDay.getTime() === tomorrow.getTime()) {
                        found.push({ id: `obj-${obj.id}-tomorrow`, type: "tomorrow", name: obj.title, kind: "objetivo" });
                    }
                }
            }

            // Check each task's due date
            for (const task of obj.tasks) {
                if (task.dueDate && !task.completed) {
                    const due = new Date(task.dueDate);
                    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
                    if (dueDay.getTime() === today.getTime()) {
                        found.push({ id: `task-${task.id}-today`, type: "today", name: task.text, kind: "tarea" });
                    } else if (dueDay.getTime() === tomorrow.getTime()) {
                        found.push({ id: `task-${task.id}-tomorrow`, type: "tomorrow", name: task.text, kind: "tarea" });
                    }
                }
            }
        }

        setAlerts(found);
    }, [objectives]);

    // Recalculate whenever objectives change
    useEffect(() => {
        buildAlerts();
    }, [buildAlerts]);

    const dismiss = (id: string) => {
        setDismissed(prev => new Set(prev).add(id));
    };

    const dismissAll = () => {
        setDismissed(new Set(alerts.map(a => a.id)));
    };

    const visible = alerts.filter(a => !dismissed.has(a.id));

    if (visible.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
            {/* Dismiss all button */}
            <AnimatePresence>
                {visible.length > 1 && (
                    <motion.button
                        key="dismiss-all"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={dismissAll}
                        className="pointer-events-auto self-end text-xs text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors px-2 py-1 rounded-lg hover:bg-black/5"
                    >
                        Descartar todo ({visible.length})
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
                {visible.map((alert) => (
                    <motion.div
                        key={alert.id}
                        layout
                        initial={{ opacity: 0, x: 60, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.2 } }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] shadow-md hover:shadow-lg transition-shadow duration-200 ${alert.type === "today" ? "border-l-4 border-l-red-500" : "border-l-4 border-l-amber-500"
                            }`}
                    >
                        {/* Icon */}
                        <div className={`shrink-0 mt-0.5 ${alert.type === "today" ? "text-red-500" : "text-amber-500"}`}>
                            {alert.type === "today" ? <AlertTriangle size={18} /> : <Clock size={18} />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${alert.type === "today" ? "text-red-600" : "text-amber-600"}`}>
                                {alert.type === "today" ? "Vence hoy" : "Vence mañana"}
                            </p>
                            <p className="text-[13px] font-medium text-[var(--foreground)] leading-snug line-clamp-2">
                                {alert.type === "today"
                                    ? `¡Hoy es la fecha límite para "${alert.name}"!`
                                    : `Mañana es la fecha límite para "${alert.name}".`}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] mt-1.5 capitalize">{alert.kind}</p>
                        </div>

                        {/* Dismiss button */}
                        <button
                            onClick={() => dismiss(alert.id)}
                            className="shrink-0 p-1.5 rounded-md transition-colors text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-gray-100"
                            aria-label="Cerrar aviso"
                        >
                            <X size={14} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
