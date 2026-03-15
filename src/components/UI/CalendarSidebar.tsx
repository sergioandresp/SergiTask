"use client";

import { ChevronLeft, ChevronRight, Target, Check } from "lucide-react";
import { useState } from "react";
import { MacroObjective } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export interface FocusTask {
    taskId: string;
    objectiveId: string;
    taskText: string;
    objectiveTitle: string;
    completed: boolean;
}

interface CalendarSidebarProps {
    objectives: MacroObjective[];
    selectedDate: Date | null;
    onSelectDate: (date: Date | null) => void;
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    // Focus panel
    focusViewOffset: 0 | 1; // 0 = hoy, 1 = mañana
    onChangeFocusView: (offset: 0 | 1) => void;
    focusTasks: FocusTask[];
    onToggleFocusTask: (taskId: string, objectiveId: string) => void;
    // Modal toggle
    isDailyFocusOpen: boolean;
    onToggleFocusOpen: () => void;
}

export default function CalendarSidebar({
    objectives,
    selectedDate,
    onSelectDate,
    isOpen,
    setIsOpen,
    focusViewOffset,
    onChangeFocusView,
    focusTasks,
    onToggleFocusTask,
    isDailyFocusOpen,
    onToggleFocusOpen,
}: CalendarSidebarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    const hasPendingTasks = (day: number, month: number, year: number) =>
        objectives.some(obj => {
            if (obj.dueDate) {
                const d = new Date(obj.dueDate);
                if (d.getDate() === day && d.getMonth() === month && d.getFullYear() === year) return true;
            }
            return obj.tasks.some(t => {
                if (t.completed || !t.dueDate) return false;
                const d = new Date(t.dueDate);
                return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
            });
        });

    const hasCompletedTasks = (day: number, month: number, year: number) =>
        objectives.some(obj =>
            obj.tasks.some(t => {
                if (!t.completedAt) return false;
                const d = new Date(t.completedAt);
                return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
            })
        );

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="w-8 h-10" />);
    }

    const today = new Date();

    for (let i = 1; i <= daysInMonth; i++) {
        const isToday = today.getDate() === i && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
        const isSelected = selectedDate?.getDate() === i && selectedDate?.getMonth() === currentDate.getMonth() && selectedDate?.getFullYear() === currentDate.getFullYear();
        const pending = hasPendingTasks(i, currentDate.getMonth(), currentDate.getFullYear());
        const completed = hasCompletedTasks(i, currentDate.getMonth(), currentDate.getFullYear());

        days.push(
            <button
                key={i}
                onClick={() => {
                    if (isSelected) { onSelectDate(null); }
                    else { onSelectDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), i)); }
                }}
                className={`w-8 h-10 rounded-xl flex flex-col items-center justify-start py-1 transition-all relative overflow-hidden
          ${isSelected ? "bg-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/30" : ""}
          ${!isSelected && isToday ? "border border-[var(--primary)] text-[var(--primary)]" : ""}
          ${!isSelected && pending && !isToday ? "bg-red-500/10 text-red-500 font-bold border border-red-500/20" : ""}
          ${!isSelected && !pending && !isToday ? "hover:bg-[var(--primary)]/10 text-[var(--foreground)]" : ""}
        `}
            >
                <span className="text-sm font-medium leading-none mb-1">{i}</span>
                <div className="flex gap-0.5">
                    {pending && <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />}
                    {completed && !pending && <div className="w-1 h-1 rounded-full bg-green-400" />}
                </div>
            </button>
        );
    }

    const focusLabel = focusViewOffset === 0 ? "Hoy" : "Mañana";
    const completedFocus = focusTasks.filter(t => t.completed).length;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="sidebar-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 top-20 bg-black/50 z-30 backdrop-blur-sm lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {isOpen && (
                <motion.aside
                    key="sidebar-panel"
                    initial={{ x: "-100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "-100%" }}
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    className="fixed top-20 bottom-0 left-0 z-[90] w-80 bg-[var(--background)] dark:bg-slate-900 border-r border-[var(--card-border)] dark:border-slate-800 shadow-2xl overflow-y-auto p-6 flex flex-col pt-10"
                >
                    {/* Calendar */}
                    <div className="glass-panel p-5 rounded-2xl mb-6 border border-white/5 bg-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-[var(--foreground)] capitalize text-lg">
                                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h3>
                            <div className="flex gap-1">
                                <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-[var(--foreground)] transition-colors"><ChevronLeft size={18} /></button>
                                <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-[var(--foreground)] transition-colors"><ChevronRight size={18} /></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-3">
                            {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map(d => (
                                <div key={d} className="w-8 h-6 flex items-center justify-center text-xs font-semibold text-[var(--text-muted)]">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-x-1 gap-y-2">{days}</div>
                        <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-4">
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
                                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]" /> Vence Hoy
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-medium">
                                <div className="w-2 h-2 rounded-full bg-green-400" /> Completadas
                            </div>
                        </div>
                    </div>

                    {/* ─── Mi Día de Enfoque ─── */}
                    <div className="mt-auto pt-6 border-t border-[var(--card-border)] dark:border-slate-800 w-full flex flex-col gap-3">

                        {/* Header with navigation */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Target size={20} className="text-[var(--primary)]" />
                                <span className="text-sm font-bold text-[var(--foreground)] tracking-wide uppercase">Deep Work</span>
                            </div>
                            {focusTasks.length > 0 && (
                                <span className="text-xs font-semibold text-[var(--text-muted)] bg-white/5 px-2 py-1 rounded-md">
                                    {completedFocus}/{focusTasks.length}
                                </span>
                            )}
                        </div>

                        {/* Day navigator — toggle para abrir/cerrar modal central */}
                        <button
                            onClick={onToggleFocusOpen}
                            className={`w-full flex items-center justify-between rounded-xl px-3 py-2 transition-all ${isDailyFocusOpen
                                ? "bg-[var(--primary)]/10 border border-[var(--primary)]/30"
                                : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                                }`}
                            title={isDailyFocusOpen ? "Cerrar vista de enfoque" : "Abrir vista de enfoque"}
                        >
                            <ChevronLeft
                                size={16}
                                className="text-[var(--text-muted)] shrink-0"
                                onClick={(e) => { e.stopPropagation(); onChangeFocusView(focusViewOffset === 1 ? 0 : 1); }}
                            />
                            <span className={`text-sm font-semibold ${isDailyFocusOpen ? "text-[var(--primary)]" : "text-[var(--foreground)]"
                                }`}>
                                {focusViewOffset === 0 ? "⚡ Hoy" : "🌅 Mañana"}
                            </span>
                            <ChevronRight
                                size={16}
                                className="text-[var(--text-muted)] shrink-0"
                                onClick={(e) => { e.stopPropagation(); onChangeFocusView(focusViewOffset === 0 ? 1 : 0); }}
                            />
                        </button>

                        {/* Focus task list */}
                        <AnimatePresence mode="popLayout">
                            {focusTasks.length === 0 ? (
                                <motion.div
                                    key="empty"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center py-4 text-xs text-[var(--text-muted)]"
                                >
                                    Nada planificado para {focusLabel.toLowerCase()}.<br />
                                    <span className="opacity-70">Usa el ícono ⊙ en las tareas.</span>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-1">
                                    {focusTasks.map(ft => (
                                        <motion.div
                                            key={ft.taskId}
                                            layout
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -8 }}
                                            className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${ft.completed ? "opacity-50 bg-black/5 dark:bg-white/5 border-transparent" : "bg-black/5 dark:bg-white/5 border-[var(--card-border)] dark:border-slate-700 hover:border-[var(--primary)]/30"}`}
                                            onClick={() => onToggleFocusTask(ft.taskId, ft.objectiveId)}
                                        >
                                            <div className={`shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${ft.completed ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-[var(--text-muted)]"}`}>
                                                {ft.completed && <Check size={9} strokeWidth={3} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-medium leading-snug ${ft.completed ? "line-through text-[var(--text-muted)]" : "text-[var(--foreground)]"}`}>
                                                    {ft.taskText}
                                                </p>
                                                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{ft.objectiveTitle}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>
    );
}
