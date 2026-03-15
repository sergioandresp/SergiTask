"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Target, Check, ChevronLeft, ChevronRight, Play, Pause, ChevronDown } from "lucide-react";
import { FocusTask } from "@/components/UI/CalendarSidebar";
import { useHyperFocusTimer } from "@/hooks/useHyperFocusTimer";
import { useCallback, useState, useRef, useEffect } from "react";

interface FocusModalProps {
    isOpen: boolean;
    onClose: () => void;
    focusTasks: FocusTask[];
    onToggleTask: (taskId: string, objectiveId: string) => void;
    focusViewOffset: 0 | 1;
    onChangeFocusView: (offset: 0 | 1) => void;
}

const DURATION_OPTIONS = [
    { label: "15 min", secs: 15 * 60 },
    { label: "30 min", secs: 30 * 60 },
    { label: "45 min", secs: 45 * 60 },
    { label: "60 min", secs: 60 * 60 },
    { label: "90 min", secs: 90 * 60 },
];

export default function FocusModal({
    isOpen,
    onClose,
    focusTasks,
    onToggleTask,
    focusViewOffset,
    onChangeFocusView,
}: FocusModalProps) {
    const completedCount = focusTasks.filter(t => t.completed).length;

    const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[1]);
    const [openDropdownFor, setOpenDropdownFor] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!openDropdownFor) return;
        const handle = (e: MouseEvent) => {
            const t = e.target as Node;
            if (dropdownRef.current && !dropdownRef.current.contains(t)) {
                setOpenDropdownFor(null);
            }
        };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [openDropdownFor]);

    const getTaskText = useCallback(
        (id: string) => focusTasks.find(t => t.taskId === id)?.taskText ?? "Tarea",
        [focusTasks]
    );

    const { activeTaskId, secsLeft, isRunning, startTimer, stopTimer, formatTime } =
        useHyperFocusTimer(getTaskText);

    const handlePlay = (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        startTimer(taskId, selectedDuration.secs);
        setOpenDropdownFor(null);
    };

    const handlePause = (e: React.MouseEvent) => {
        e.stopPropagation();
        stopTimer();
    };

    const handleDropdownToggle = (e: React.MouseEvent, taskId: string) => {
        e.stopPropagation();
        setOpenDropdownFor(prev => (prev === taskId ? null : taskId));
    };

    const handleSelectDuration = (e: React.MouseEvent, option: typeof DURATION_OPTIONS[0]) => {
        e.stopPropagation();
        setSelectedDuration(option);
        setOpenDropdownFor(null);
    };

    const isCritical = isRunning && secsLeft <= 5 * 60;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    key="focus-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        key="focus-modal-box"
                        initial={{ opacity: 0, scale: 0.93, y: 16 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.93, y: 16 }}
                        transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* ── Header ── */}
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Target size={18} className="text-[var(--primary)]" />
                                    <h2 className="font-bold text-gray-900 dark:text-slate-200 tracking-wide uppercase text-sm">
                                        Deep Work
                                    </h2>
                                </div>
                                <span className="text-sm font-semibold text-gray-400 dark:text-slate-500">
                                    {completedCount}/{focusTasks.length}
                                </span>
                            </div>

                            {/* Day navigator */}
                            <div className="flex items-center justify-between bg-gray-50 dark:bg-slate-700/50 rounded-xl px-3 py-2">
                                <button
                                    onClick={() => onChangeFocusView(focusViewOffset === 1 ? 0 : 1)}
                                    className="p-1 rounded-md text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-sm font-semibold text-gray-800 dark:text-slate-200">
                                    {focusViewOffset === 0 ? "⚡ Hoy" : "🌅 Mañana"}
                                </span>
                                <button
                                    onClick={() => onChangeFocusView(focusViewOffset === 0 ? 1 : 0)}
                                    className="p-1 rounded-md text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        {/* ── Task list ── */}
                        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                            <AnimatePresence mode="popLayout">
                                {focusTasks.length === 0 ? (
                                    <motion.div
                                        key="empty"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="text-center py-10 text-gray-400 dark:text-slate-500"
                                    >
                                        <Target size={36} className="mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">
                                            No hay tareas para {focusViewOffset === 0 ? "hoy" : "mañana"}.
                                        </p>
                                        <p className="text-xs mt-1 opacity-70">
                                            Usa el ícono ⊙ en las tareas para planificarlas.
                                        </p>
                                    </motion.div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {focusTasks.map(ft => {
                                            const isActive = activeTaskId === ft.taskId;
                                            const isDimmed = isRunning && !isActive;
                                            const isDropdownOpen = openDropdownFor === ft.taskId;

                                            return (
                                                <motion.div
                                                    key={ft.taskId}
                                                    layout
                                                    initial={{ opacity: 0, x: -8 }}
                                                    animate={{ opacity: isDimmed ? 0.4 : 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 8 }}
                                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border-l-4 transition-all group cursor-pointer ${ft.completed
                                                        ? "bg-gray-50 dark:bg-slate-700/30 border-l-gray-200 dark:border-l-slate-600 border border-gray-100 dark:border-slate-700"
                                                        : isActive
                                                            ? "bg-white dark:bg-slate-700 border-l-slate-700 dark:border-l-slate-300 border border-gray-100 dark:border-slate-600 shadow-lg"
                                                            : "bg-white dark:bg-slate-800/50 border-l-transparent border border-gray-100 dark:border-slate-700 hover:border-l-gray-300 dark:hover:border-l-slate-400 hover:shadow-sm"
                                                        } ${isDimmed ? "pointer-events-none select-none" : ""}`}
                                                    onClick={() => !isDimmed && onToggleTask(ft.taskId, ft.objectiveId)}
                                                >
                                                    {/* Checkbox */}
                                                    <div className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${ft.completed
                                                        ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                                                        : "border-gray-300 dark:border-slate-500 group-hover:border-[var(--primary)]"
                                                        }`}>
                                                        {ft.completed && <Check size={14} strokeWidth={3} />}
                                                    </div>

                                                    {/* Text */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium leading-snug ${ft.completed
                                                            ? "line-through text-gray-400 dark:text-slate-500"
                                                            : isActive
                                                                ? "text-gray-900 dark:text-slate-100 font-semibold"
                                                                : "text-gray-700 dark:text-slate-300"
                                                            }`}>
                                                            {ft.taskText}
                                                        </p>
                                                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">
                                                            {ft.objectiveTitle}
                                                        </p>
                                                    </div>

                                                    {/* Timer controls */}
                                                    {!ft.completed && (
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {/* ACTIVE state */}
                                                            {isActive && (
                                                                <>
                                                                    <motion.span
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        className={`text-xl font-mono font-bold tabular-nums ${isCritical ? "text-red-500" : "text-slate-800 dark:text-slate-200"}`}
                                                                    >
                                                                        {formatTime(secsLeft)}
                                                                    </motion.span>
                                                                    <button
                                                                        onClick={handlePause}
                                                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isCritical
                                                                            ? "bg-red-100 dark:bg-red-900/30 text-red-500 hover:bg-red-200 dark:hover:bg-red-900/50"
                                                                            : "bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-500"
                                                                            }`}
                                                                        title="Detener sesión"
                                                                    >
                                                                        <Pause size={14} />
                                                                    </button>
                                                                </>
                                                            )}

                                                            {/* INACTIVE state */}
                                                            {!isActive && (
                                                                <div
                                                                    className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                                    onClick={e => e.stopPropagation()}
                                                                >
                                                                    {/* Duration pill */}
                                                                    <div className="relative" ref={isDropdownOpen ? dropdownRef : null}>
                                                                        <button
                                                                            onClick={e => handleDropdownToggle(e, ft.taskId)}
                                                                            className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-600 transition-all"
                                                                            title="Cambiar duración"
                                                                        >
                                                                            <span>{selectedDuration.label}</span>
                                                                            <ChevronDown size={11} className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                                                                        </button>

                                                                        <AnimatePresence>
                                                                            {isDropdownOpen && (
                                                                                <motion.div
                                                                                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                                                                                    transition={{ duration: 0.12 }}
                                                                                    className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-700 shadow-xl border border-gray-100 dark:border-slate-600 rounded-xl overflow-hidden min-w-[100px]"
                                                                                >
                                                                                    {DURATION_OPTIONS.map(opt => (
                                                                                        <button
                                                                                            key={opt.secs}
                                                                                            onClick={e => handleSelectDuration(e, opt)}
                                                                                            className="w-full text-left px-4 py-2 text-xs text-gray-700 dark:text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-150 ease-in-out first:rounded-t-lg last:rounded-b-lg"
                                                                                        >
                                                                                            {opt.label}
                                                                                        </button>
                                                                                    ))}
                                                                                </motion.div>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </div>

                                                                    {/* Play button */}
                                                                    <button
                                                                        onClick={e => handlePlay(e, ft.taskId)}
                                                                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 dark:text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                                                                        title={`Iniciar ${selectedDuration.label} de Hyper-Focus`}
                                                                    >
                                                                        <Play size={14} />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
