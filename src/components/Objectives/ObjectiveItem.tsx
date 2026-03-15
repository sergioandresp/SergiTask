"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { Trash2, ChevronDown, ChevronUp, Compass, StickyNote, Mic, CalendarClock, Bold, List, GripVertical, Check, Target } from "lucide-react";
import { MacroObjective, Task } from "@/types";
import { useVoice } from "@/hooks/useVoice";
import Form from "../UI/Form";
import TaskItem from "./TaskItem";
import Sergiplot from "./Sergiplot";

interface ObjectiveItemProps {
    objective: MacroObjective;
    onUpdate: (updated: MacroObjective) => void;
    onDelete: (id: string) => void;
    selectedDate: Date | null;
}

export default function ObjectiveItem({ objective, onUpdate, onDelete, selectedDate }: ObjectiveItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAI, setShowAI] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showFocusMenu, setShowFocusMenu] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [focusPos, setFocusPos] = useState({ top: 0, right: 0 });
    const [notesPos, setNotesPos] = useState({ top: 0, right: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Inline title editing
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editTitle, setEditTitle] = useState(objective.title);
    const titleInputRef = useRef<HTMLInputElement>(null);

    const hasNotes = !!objective.notes && objective.notes.trim().length > 0;

    const objDateInputRef = useRef<HTMLInputElement>(null);
    const notesEditorRef = useRef<HTMLDivElement>(null);
    const notesButtonRef = useRef<HTMLButtonElement>(null);
    const notesPopupRef = useRef<HTMLDivElement>(null);
    const focusMenuRef = useRef<HTMLDivElement>(null);
    const focusButtonRef = useRef<HTMLButtonElement>(null);

    // Drag controls for this objective item
    const dragControls = useDragControls();

    // Always-fresh ref to save — avoids stale closures in event listeners
    const saveRef = useRef<() => void>(() => { });
    useEffect(() => {
        saveRef.current = () => {
            const html = notesEditorRef.current?.innerHTML ?? "";
            onUpdate({ ...objective, notes: html });
        };
    });

    // Close on click outside — auto-saves via fresh ref
    useEffect(() => {
        if (!showNotes) return;
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const clickedPopup = notesPopupRef.current?.contains(target);
            const clickedButton = notesButtonRef.current?.contains(target);
            if (!clickedPopup && !clickedButton) {
                saveRef.current();
                setShowNotes(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotes]);

    // Close focus menu on click outside
    useEffect(() => {
        if (!showFocusMenu) return;
        const h = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!focusMenuRef.current?.contains(t) && !focusButtonRef.current?.contains(t)) {
                setShowFocusMenu(false);
            }
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [showFocusMenu]);

    // Sync ref updated on every render — editorRefCallback reads this when popup remounts
    const latestNotesRef = useRef(objective.notes || "");
    latestNotesRef.current = objective.notes || "";

    // Ref callback — sets innerHTML when the editor mounts (popup open)
    const editorRefCallback = useCallback((el: HTMLDivElement | null) => {
        notesEditorRef.current = el;
        if (el) el.innerHTML = latestNotesRef.current;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const insertFormat = (type: 'bold' | 'bullet') => {
        notesEditorRef.current?.focus();
        document.execCommand(type === 'bold' ? 'bold' : 'insertUnorderedList', false);
        saveNotesHtml();
    };

    const saveNotesHtml = () => {
        const html = notesEditorRef.current?.innerHTML ?? "";
        onUpdate({ ...objective, notes: html });
    };

    // Voice
    const baseHtmlBeforeVoiceRef = useRef("");

    const setVoiceText = useCallback((text: string) => {
        const el = notesEditorRef.current;
        if (!el) return;
        const base = baseHtmlBeforeVoiceRef.current;
        el.innerHTML = base + (base ? " " : "") + text;
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(el);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
        saveNotesHtml();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const { isListening, toggleListen } = useVoice("", setVoiceText);

    const handleToggleListen = () => {
        if (!isListening) {
            baseHtmlBeforeVoiceRef.current = notesEditorRef.current?.innerHTML ?? "";
        }
        toggleListen();
    };

    // Title editing handlers
    const startEditTitle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditTitle(objective.title);
        setIsEditingTitle(true);
        setTimeout(() => {
            titleInputRef.current?.select();
        }, 0);
    };

    const commitTitle = () => {
        const trimmed = editTitle.trim();
        if (trimmed && trimmed !== objective.title) {
            onUpdate({ ...objective, title: trimmed });
        }
        setIsEditingTitle(false);
    };

    const cancelTitle = () => {
        setEditTitle(objective.title);
        setIsEditingTitle(false);
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") { e.preventDefault(); commitTitle(); }
        if (e.key === "Escape") { cancelTitle(); }
    };

    // Task handlers
    const completedCount = objective.tasks.filter(t => t.completed).length;
    const isObjectiveCompleted = !!objective.completedAt;
    const progress = isObjectiveCompleted ? 100 : (objective.tasks.length === 0 ? 0 : (completedCount / objective.tasks.length) * 100);

    // Focus planning for the objective itself
    const getDateOnly = (offset = 0) => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset).getTime();
    };
    const todayTs = getDateOnly(0);
    const tomorrowTs = getDateOnly(1);
    const isPlannedToday = objective.plannedDate === todayTs;
    const isPlannedTomorrow = objective.plannedDate === tomorrowTs;
    const isPlanned = isPlannedToday || isPlannedTomorrow;

    const handlePlanToday = () => {
        onUpdate({ ...objective, plannedDate: isPlannedToday ? undefined : todayTs });
        setShowFocusMenu(false);
    };
    const handlePlanTomorrow = () => {
        onUpdate({ ...objective, plannedDate: isPlannedTomorrow ? undefined : tomorrowTs });
        setShowFocusMenu(false);
    };

    const handleAddTask = (text: string, dueDate?: number) => {
        const newTask: Task = {
            id: crypto.randomUUID(),
            text,
            completed: false,
            createdAt: Date.now(),
            dueDate,
        };
        onUpdate({ ...objective, tasks: [newTask, ...objective.tasks] });
    };

    const handleToggleTask = (taskId: string) => {
        onUpdate({
            ...objective,
            tasks: objective.tasks.map(t => t.id === taskId ? {
                ...t,
                completed: !t.completed,
                completedAt: !t.completed ? Date.now() : undefined
            } : t),
        });
    };

    const handleDeleteTask = (taskId: string) => {
        onUpdate({ ...objective, tasks: objective.tasks.filter(t => t.id !== taskId) });
    };

    const handleUpdateTaskNotes = (taskId: string, notes: string) => {
        onUpdate({ ...objective, tasks: objective.tasks.map(t => t.id === taskId ? { ...t, notes } : t) });
    };

    const handleUpdateTaskDueDate = (taskId: string, dueDate: number | undefined) => {
        onUpdate({ ...objective, tasks: objective.tasks.map(t => t.id === taskId ? { ...t, dueDate } : t) });
    };

    const handleUpdateTaskText = (taskId: string, text: string) => {
        onUpdate({ ...objective, tasks: objective.tasks.map(t => t.id === taskId ? { ...t, text } : t) });
    };

    const handleUpdateTaskPlannedDate = (taskId: string, plannedDate: number | undefined) => {
        onUpdate({ ...objective, tasks: objective.tasks.map(t => t.id === taskId ? { ...t, plannedDate } : t) });
    };

    const handleReorderTasks = (newTasks: Task[]) => {
        onUpdate({ ...objective, tasks: newTasks });
    };

    const handleUpdateObjectiveDueDate = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.value) { onUpdate({ ...objective, dueDate: undefined }); return; }
        const [year, month, day] = e.target.value.split('-').map(Number);
        onUpdate({ ...objective, dueDate: new Date(year, month - 1, day).getTime() });
    };

    const isDueToday = selectedDate && objective.dueDate &&
        new Date(objective.dueDate).toDateString() === selectedDate.toDateString();

    const formattedDate = objective.dueDate ? (() => {
        const d = new Date(objective.dueDate);
        const day = String(d.getDate()).padStart(2, '0');
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        return `${day}/${months[d.getMonth()]}`;
    })() : '+ Fecha';

    const toggleNotes = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!showNotes && notesButtonRef.current) {
            const rect = notesButtonRef.current.getBoundingClientRect();
            setNotesPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
        }
        if (showNotes) saveNotesHtml();
        setShowNotes(!showNotes);
    };

    const handleApproveAITasks = (tasks: string[]) => {
        const newTasks: Task[] = tasks.map(text => ({
            id: crypto.randomUUID(), text, completed: false, createdAt: Date.now(),
        }));
        onUpdate({ ...objective, tasks: [...newTasks, ...objective.tasks] });
        setShowAI(false);
    };

    return (
        <Reorder.Item
            value={objective}
            layout
            dragListener={false}
            dragControls={dragControls}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => { setTimeout(() => setIsDragging(false), 200); }}
            transition={{ layout: { type: "spring", stiffness: 600, damping: 35, mass: 0.5 } }}
            whileDrag={{ scale: 1.02, boxShadow: "0 16px 40px rgba(0,0,0,0.18)" }}
            className={`glass-panel dark:bg-slate-800/80 rounded-2xl mb-4 overflow-visible transition-shadow duration-200 select-none ${isObjectiveCompleted ? "opacity-70" : ""} ${isDueToday ? "shadow-[0_0_15px_rgba(239,68,68,0.5)] border-red-500/50" : "dark:border-slate-700"}`}
            style={{ listStyle: "none", position: "relative", zIndex: (showFocusMenu || showNotes) ? 200 : 1 }}
        >
            <div
                className="p-5 flex flex-col gap-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors relative z-20"
                onClick={() => {
                    if (!isEditingTitle && !isDragging) {
                        setIsExpanded(!isExpanded);
                    }
                }}
            >
                <div className="flex items-center gap-4">
                    {/* Drag handle */}
                    <div
                        className="shrink-0 cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors touch-none"
                        onPointerDown={(e) => { e.preventDefault(); dragControls.start(e); }}
                        onClick={(e) => e.stopPropagation()}
                        title="Arrastrar para reordenar"
                    >
                        <GripVertical size={20} />
                    </div>

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {isEditingTitle ? (
                            <input
                                ref={titleInputRef}
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={commitTitle}
                                onKeyDown={handleTitleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 text-xl font-bold bg-transparent border-b-2 border-[var(--primary)] outline-none text-[var(--foreground)] py-0.5 min-w-0"
                                autoFocus
                            />
                        ) : (
                            <span
                                className={`text-xl font-bold transition-colors truncate cursor-pointer ${isObjectiveCompleted ? "line-through text-[var(--text-muted)]" : (progress === 100 && objective.tasks.length > 0 ? "text-[var(--primary)]" : "text-[var(--foreground)]")}`}
                                onDoubleClick={startEditTitle}
                                title="Doble clic para editar"
                            >
                                {objective.title}
                            </span>
                        )}
                        <span className="text-sm font-medium text-[var(--text-muted)] dark:text-slate-400 bg-[var(--card-border)] dark:bg-slate-700/50 px-2 py-1 rounded-md shrink-0">
                            {completedCount}/{objective.tasks.length}
                        </span>
                    </div>

                    {objective.dueDate && (
                        <span className="whitespace-nowrap text-sm font-bold tracking-wide text-red-500 shrink-0" onClick={(e) => e.stopPropagation()}>
                            {formattedDate}
                        </span>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        <div
                            className="relative p-2 rounded-xl transition-all cursor-pointer text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 opacity-50 hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); objDateInputRef.current?.showPicker(); }}
                        >
                            <input
                                ref={objDateInputRef}
                                type="date"
                                value={objective.dueDate ? new Date(objective.dueDate).toISOString().split('T')[0] : ""}
                                onChange={handleUpdateObjectiveDueDate}
                                className="sr-only"
                                title="Seleccionar fecha"
                            />
                            <CalendarClock size={20} className="pointer-events-none" />
                        </div>
                        {/* Focus plan button for objective */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                                ref={focusButtonRef}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!showFocusMenu && focusButtonRef.current) {
                                        const rect = focusButtonRef.current.getBoundingClientRect();
                                        setFocusPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
                                    }
                                    setShowFocusMenu(p => !p);
                                }}
                                className={`p-2 rounded-xl transition-all ${isPlanned ? "text-[var(--primary)] opacity-100" : "text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-black/5 dark:hover:bg-white/5 opacity-50 hover:opacity-100"}`}
                                title={isPlanned ? `Planificado para ${isPlannedToday ? "hoy" : "mañana"}` : "Planificar para mi día"}
                            >
                                <Target size={20} className={isPlanned ? "fill-[var(--primary)]/20" : ""} />
                            </button>
                        </div>
                        <button
                            ref={notesButtonRef}
                            onClick={toggleNotes}
                            className={`p-2 rounded-xl transition-all relative ${showNotes
                                ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                                : hasNotes
                                    ? "text-[var(--primary)] hover:bg-black/5 dark:hover:bg-white/5"
                                    : "text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-black/5 dark:hover:bg-white/5 opacity-50 hover:opacity-100"
                                }`}
                            aria-label="Notas del objetivo"
                        >
                            <StickyNote size={20} className={hasNotes && !showNotes ? "fill-current" : ""} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(objective.id); }}
                            className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all opacity-50 hover:opacity-100"
                            aria-label="Eliminar objetivo"
                        >
                            <Trash2 size={20} />
                        </button>
                        <div className="p-1 text-[var(--text-muted)]">
                            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-2 pl-8">
                    <div className="h-2 flex-1 bg-[var(--card-border)] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--primary)] transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className={`text-xs font-bold tabular-nums shrink-0 transition-colors duration-300 ${progress === 100 ? "text-green-400" : progress > 0 ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}>
                        {Math.round(progress)}%
                    </span>
                </div>

            </div>

            {/* Expanded task list */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-[var(--card-border)] dark:border-slate-700/50 bg-black/5 dark:bg-black/20"
                    >
                        <div className="p-5">
                            <div className="flex justify-between items-center mb-5 gap-4">
                                <Form
                                    onAdd={handleAddTask}
                                    placeholder="¿Qué micro-tarea necesitas hacer?"
                                    buttonText="Añadir Manualmente"
                                    className="flex-1 mb-0"
                                    showDateInput={true}
                                />
                                <button
                                    onClick={() => setShowAI(!showAI)}
                                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all shadow-sm ${showAI
                                        ? "bg-[var(--primary)] text-white"
                                        : "bg-[var(--card-bg)] dark:bg-slate-800 border border-[var(--primary)]/30 dark:border-slate-600 text-[var(--primary)] dark:text-blue-400 hover:bg-[var(--primary)]/10 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    <Compass size={18} />
                                    <span className="hidden sm:inline">{showAI ? "Cerrar Sergiplot" : "Sergiplot IA"}</span>
                                </button>
                            </div>

                            <AnimatePresence>
                                {showAI && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.98, height: 0 }}
                                        animate={{ opacity: 1, scale: 1, height: "auto" }}
                                        exit={{ opacity: 0, scale: 0.98, height: 0 }}
                                        className="mb-8"
                                    >
                                        <Sergiplot objectiveTitle={objective.title} onApproveTasks={handleApproveAITasks} />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {objective.tasks.length === 0 ? (
                                <p className="text-center text-[var(--text-muted)] py-4">No hay micro-tareas aún.</p>
                            ) : (
                                <Reorder.Group
                                    axis="y"
                                    values={objective.tasks}
                                    onReorder={handleReorderTasks}
                                    className="space-y-3 list-none p-0"
                                >
                                    {objective.tasks.map(task => (
                                        <TaskItem
                                            key={task.id}
                                            task={task}
                                            onToggle={() => handleToggleTask(task.id)}
                                            onDelete={() => handleDeleteTask(task.id)}
                                            onUpdateNotes={(notes) => handleUpdateTaskNotes(task.id, notes)}
                                            onUpdateDueDate={(date) => handleUpdateTaskDueDate(task.id, date)}
                                            onUpdateText={(text) => handleUpdateTaskText(task.id, text)}
                                            onUpdatePlannedDate={(date) => handleUpdateTaskPlannedDate(task.id, date)}
                                            selectedDate={selectedDate}
                                        />
                                    ))}
                                </Reorder.Group>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Portals for Popups */}
            {mounted && createPortal(
                <>
                    <AnimatePresence>
                        {showFocusMenu && (
                            <motion.div
                                ref={focusMenuRef}
                                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                transition={{ duration: 0.12 }}
                                style={{ position: 'fixed', top: focusPos.top, right: focusPos.right, zIndex: 9999 }}
                                className="bg-[var(--card-bg)] dark:bg-slate-800 border border-[var(--card-border)] dark:border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[200px]"
                            >
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePlanToday(); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-[var(--primary)]/10 ${isPlannedToday ? "text-[var(--primary)] font-semibold" : "text-[var(--foreground)]"}`}
                                >
                                    <span className="text-base">⚡</span>
                                    <span>{isPlannedToday ? "Quitar de hoy" : "Planificar para Hoy"}</span>
                                </button>
                                <div className="border-t border-[var(--card-border)]" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePlanTomorrow(); }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors hover:bg-[var(--primary)]/10 ${isPlannedTomorrow ? "text-[var(--primary)] font-semibold" : "text-[var(--foreground)]"}`}
                                >
                                    <span className="text-base">🌅</span>
                                    <span>{isPlannedTomorrow ? "Quitar de mañana" : "Planificar para Mañana"}</span>
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {showNotes && (
                            <motion.div
                                ref={notesPopupRef}
                                initial={{ opacity: 0, scale: 0.5, x: 20 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.5, x: 20 }}
                                style={{ position: 'fixed', top: notesPos.top, right: notesPos.right, zIndex: 9999 }}
                                className="w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-[var(--card-bg)] dark:bg-slate-800 border border-[var(--primary)]/30 dark:border-slate-700 rounded-xl shadow-2xl origin-top-right overflow-hidden flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="relative p-3">
                                    <div
                                        ref={editorRefCallback}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={saveNotesHtml}
                                        data-placeholder="Añade notas o dicta para el Macro-Objetivo..."
                                        className="w-full bg-[var(--background)] dark:bg-slate-900/50 border border-[var(--card-border)] dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-[var(--primary)] outline-none text-sm p-4 pb-14 text-[var(--foreground)] min-h-[120px] cursor-text [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[var(--text-muted)] [&:empty]:before:pointer-events-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:my-0.5"
                                    />
                                    <div className="absolute right-6 bottom-6 flex items-center gap-1">
                                        <button onMouseDown={(e) => { e.preventDefault(); insertFormat('bold'); }} className="p-2 rounded-full transition-all flex items-center justify-center bg-[var(--card-bg)] dark:bg-slate-800 text-[var(--text-muted)] dark:text-slate-400 hover:text-[var(--primary)] dark:hover:text-white shadow-sm border border-[var(--card-border)] dark:border-slate-700" title="Negrita">
                                            <Bold size={14} className="relative z-10" />
                                        </button>
                                        <button onMouseDown={(e) => { e.preventDefault(); insertFormat('bullet'); }} className="p-2 rounded-full transition-all flex items-center justify-center bg-[var(--card-bg)] dark:bg-slate-800 text-[var(--text-muted)] dark:text-slate-400 hover:text-[var(--primary)] dark:hover:text-white shadow-sm border border-[var(--card-border)] dark:border-slate-700" title="Viñeta">
                                            <List size={14} className="relative z-10" />
                                        </button>
                                        <button onMouseDown={(e) => { e.preventDefault(); handleToggleListen(); }} className={`p-2 rounded-full transition-all flex items-center justify-center ${isListening ? "bg-red-500/20 text-red-500" : "bg-[var(--card-bg)] dark:bg-slate-800 text-[var(--text-muted)] dark:text-slate-400 hover:text-[var(--primary)] dark:hover:text-white shadow-sm border border-[var(--card-border)] dark:border-slate-700"}`} title="Dictar por voz">
                                            {isListening && <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></span>}
                                            <Mic size={14} className="relative z-10" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </>,
                document.body
            )}
        </Reorder.Item>
    );
}
