"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import { Check, Trash2, StickyNote, Mic, CalendarClock, Bold, List, GripVertical, Target } from "lucide-react";
import { Task } from "@/types";
import { useVoice } from "@/hooks/useVoice";

interface TaskItemProps {
    task: Task;
    onToggle: () => void;
    onDelete: () => void;
    onUpdateNotes?: (notes: string) => void;
    onUpdateDueDate?: (date: number | undefined) => void;
    onUpdateText?: (text: string) => void;
    onUpdatePlannedDate?: (date: number | undefined) => void;
    selectedDate: Date | null;
}

export default function TaskItem({ task, onToggle, onDelete, onUpdateNotes, onUpdateDueDate, onUpdateText, onUpdatePlannedDate, selectedDate }: TaskItemProps) {
    const [showNotes, setShowNotes] = useState(false);
    const [showFocusMenu, setShowFocusMenu] = useState(false);

    // Inline text editing
    const [isEditingText, setIsEditingText] = useState(false);
    const [editText, setEditText] = useState(task.text);
    const textInputRef = useRef<HTMLInputElement>(null);

    const hasNotes = !!task.notes && task.notes.trim().length > 0;

    const dateInputRef = useRef<HTMLInputElement>(null);
    const notesEditorRef = useRef<HTMLDivElement>(null);
    const notesButtonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const focusMenuRef = useRef<HTMLDivElement>(null);
    const focusButtonRef = useRef<HTMLButtonElement>(null);
    const [popupPos, setPopupPos] = useState({ top: 0, right: 0 });
    const [focusPos, setFocusPos] = useState({ top: 0, right: 0 });
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const dragControls = useDragControls();

    // Always-fresh ref to save notes
    const saveRef = useRef<() => void>(() => { });
    useEffect(() => {
        saveRef.current = () => {
            const html = notesEditorRef.current?.innerHTML ?? "";
            onUpdateNotes?.(html);
        };
    });

    // Close notes on click outside
    useEffect(() => {
        if (!showNotes) return;
        const h = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!popupRef.current?.contains(t) && !notesButtonRef.current?.contains(t)) {
                saveRef.current();
                setShowNotes(false);
            }
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
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

    // Sync ref for notes init
    const latestNotesRef = useRef(task.notes || "");
    latestNotesRef.current = task.notes || "";

    const editorRefCallback = useCallback((el: HTMLDivElement | null) => {
        notesEditorRef.current = el;
        if (el) el.innerHTML = latestNotesRef.current;
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const saveNotes = () => {
        const html = notesEditorRef.current?.innerHTML ?? "";
        onUpdateNotes?.(html);
    };

    const execFormat = (command: string) => {
        notesEditorRef.current?.focus();
        document.execCommand(command, false);
        saveNotes();
    };

    const insertBullet = () => {
        notesEditorRef.current?.focus();
        document.execCommand('insertUnorderedList', false);
        saveNotes();
    };

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
        saveNotes();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const { isListening, toggleListen } = useVoice("", setVoiceText);
    const handleToggleListen = () => {
        if (!isListening) baseHtmlBeforeVoiceRef.current = notesEditorRef.current?.innerHTML ?? "";
        toggleListen();
    };

    // Text editing
    const startEditText = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditText(task.text);
        setIsEditingText(true);
        setTimeout(() => textInputRef.current?.select(), 0);
    };
    const commitText = () => {
        const t = editText.trim();
        if (t && t !== task.text) onUpdateText?.(t);
        setIsEditingText(false);
    };
    const cancelText = () => { setEditText(task.text); setIsEditingText(false); };
    const handleTextKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") { e.preventDefault(); commitText(); }
        if (e.key === "Escape") cancelText();
    };

    // Focus planning
    const getDateOnly = (offset = 0) => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), d.getDate() + offset).getTime();
    };

    const today = getDateOnly(0);
    const tomorrow = getDateOnly(1);

    const isPlannedToday = task.plannedDate === today;
    const isPlannedTomorrow = task.plannedDate === tomorrow;
    const isPlanned = isPlannedToday || isPlannedTomorrow;

    const handlePlanToday = () => {
        onUpdatePlannedDate?.(isPlannedToday ? undefined : today);
        setShowFocusMenu(false);
    };
    const handlePlanTomorrow = () => {
        onUpdatePlannedDate?.(isPlannedTomorrow ? undefined : tomorrow);
        setShowFocusMenu(false);
    };

    const isDueToday = selectedDate && task.dueDate &&
        new Date(task.dueDate).toDateString() === selectedDate.toDateString();

    const formattedDate = task.dueDate ? (() => {
        const d = new Date(task.dueDate);
        const day = String(d.getDate()).padStart(2, '0');
        const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        return `${day}/${months[d.getMonth()]}`;
    })() : '';

    const toggleNotes = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!showNotes && notesButtonRef.current) {
            const rect = notesButtonRef.current.getBoundingClientRect();
            setPopupPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
        }
        if (showNotes) saveNotes();
        setShowNotes(prev => !prev);
    };

    return (
        <Reorder.Item
            value={task}
            layout
            dragListener={false}
            dragControls={dragControls}
            transition={{ layout: { type: "spring", stiffness: 600, damping: 35, mass: 0.5 } }}
            whileDrag={{ scale: 1.03, boxShadow: "0 8px 24px rgba(0,0,0,0.14)" }}
            className={`relative bg-[var(--card-bg)] dark:bg-slate-800/80 border rounded-xl flex flex-col transition-shadow duration-200 select-none ${task.completed ? "opacity-70" : ""} ${isDueToday ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "border-[var(--card-border)] dark:border-slate-700"}`}
            style={{ listStyle: "none", position: "relative", zIndex: "auto" }}
        >
            <div className="p-3 flex items-center gap-2">
                {/* Drag handle */}
                <div
                    className="shrink-0 cursor-grab active:cursor-grabbing text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors opacity-40 hover:opacity-100 touch-none"
                    onPointerDown={(e) => { e.preventDefault(); dragControls.start(e); }}
                    title="Arrastrar para reordenar"
                >
                    <GripVertical size={16} />
                </div>

                <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group" onClick={onToggle}>
                    <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${task.completed ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-[var(--text-muted)] group-hover:border-[var(--primary)] text-transparent"}`}>
                        <Check size={12} strokeWidth={3} />
                    </div>
                    {isEditingText ? (
                        <input
                            ref={textInputRef}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onBlur={commitText}
                            onKeyDown={handleTextKeyDown}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 text-sm bg-transparent border-b border-[var(--primary)] outline-none text-[var(--foreground)] py-0.5 min-w-0"
                            autoFocus
                        />
                    ) : (
                        <span
                            className={`flex-1 text-sm transition-all duration-300 truncate ${task.completed ? "line-through text-[var(--text-muted)]" : "text-[var(--foreground)]"}`}
                            onDoubleClick={startEditText}
                            title="Doble clic para editar"
                        >
                            {task.text}
                        </span>
                    )}
                </div>

                {task.dueDate && (
                    <span className="whitespace-nowrap text-xs font-bold tracking-wide text-red-500 shrink-0" onClick={(e) => e.stopPropagation()}>
                        {formattedDate}
                    </span>
                )}

                <div className="flex items-center gap-1 shrink-0">
                    {/* Due date picker */}
                    <div
                        className="relative p-1.5 rounded-lg transition-all cursor-pointer text-[var(--text-muted)] hover:bg-black/5 opacity-50 hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); dateInputRef.current?.showPicker(); }}
                    >
                        <input
                            ref={dateInputRef}
                            type="date"
                            value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ""}
                            onChange={(e) => {
                                if (!e.target.value) { onUpdateDueDate?.(undefined); return; }
                                const [year, month, day] = e.target.value.split('-').map(Number);
                                onUpdateDueDate?.(new Date(year, month - 1, day).getTime());
                            }}
                            className="sr-only"
                            title="Fecha límite"
                        />
                        <CalendarClock size={15} className="pointer-events-none" />
                    </div>

                    {/* Focus plan button */}
                    <div className="relative">
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
                            className={`p-1.5 rounded-lg transition-all ${isPlanned ? "text-[var(--primary)] opacity-100" : "text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-[var(--primary)]"}`}
                            title={isPlanned ? `Planificado para ${isPlannedToday ? "hoy" : "mañana"}` : "Planificar para mi día"}
                        >
                            <Target size={15} className={isPlanned ? "fill-[var(--primary)]/20" : ""} />
                        </button>
                    </div>

                    {/* Notes */}
                    <button
                        ref={notesButtonRef}
                        onClick={toggleNotes}
                        className={`p-1.5 rounded-lg transition-all ${showNotes ? "bg-[var(--primary)]/10 text-[var(--primary)]" : hasNotes ? "text-[var(--primary)]" : "text-[var(--text-muted)] opacity-50 hover:opacity-100 hover:text-[var(--primary)]"}`}
                        aria-label="Notas de la tarea"
                    >
                        <StickyNote size={15} className={hasNotes && !showNotes ? "fill-current" : ""} />
                    </button>

                    {/* Delete */}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-50 hover:opacity-100"
                        aria-label="Eliminar tarea"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            </div>

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
                                className="bg-[var(--card-bg)] dark:bg-slate-800 border border-[var(--card-border)] dark:border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[180px]"
                                onClick={(e) => e.stopPropagation()}
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
                                key="task-notes-popup"
                                ref={popupRef}
                                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                                style={{ position: 'fixed', top: popupPos.top, right: popupPos.right, zIndex: 9999 }}
                                className="w-80 bg-[var(--card-bg)] dark:bg-slate-800 border border-[var(--card-border)] dark:border-slate-700 shadow-2xl origin-top-right rounded-xl overflow-hidden"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="relative p-2">
                                    <div
                                        ref={editorRefCallback}
                                        contentEditable
                                        suppressContentEditableWarning
                                        onInput={saveNotes}
                                        data-placeholder="Añade notas..."
                                        className="w-full bg-[var(--background)] dark:bg-slate-900/50 border border-[var(--card-border)] dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-[var(--primary)] outline-none text-sm p-3 pb-14 text-[var(--foreground)] dark:text-slate-200 min-h-[100px] cursor-text [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-[var(--text-muted)] [&:empty]:before:pointer-events-none [&_ul]:list-disc [&_ul]:ml-5 [&_ol]:list-decimal [&_ol]:ml-5 [&_li]:my-0.5"
                                    />
                                    <div className="absolute right-4 bottom-4 flex items-center gap-1">
                                        <button onMouseDown={(e) => { e.preventDefault(); execFormat('bold'); }} className="p-2 rounded-full transition-all flex items-center justify-center bg-[var(--card-bg)] dark:bg-slate-800 text-[var(--text-muted)] dark:text-slate-400 hover:text-[var(--primary)] dark:hover:text-white shadow-sm border border-[var(--card-border)] dark:border-slate-700" title="Negrita">
                                            <Bold size={14} />
                                        </button>
                                        <button onMouseDown={(e) => { e.preventDefault(); insertBullet(); }} className="p-2 rounded-full transition-all flex items-center justify-center bg-[var(--card-bg)] dark:bg-slate-800 text-[var(--text-muted)] dark:text-slate-400 hover:text-[var(--primary)] dark:hover:text-white shadow-sm border border-[var(--card-border)] dark:border-slate-700" title="Viñeta">
                                            <List size={14} />
                                        </button>
                                        <button onMouseDown={(e) => { e.preventDefault(); handleToggleListen(); }} className={`relative p-2 rounded-full transition-all flex items-center justify-center ${isListening ? "bg-red-500/20 text-red-500" : "bg-[var(--card-bg)] dark:bg-slate-800 text-[var(--text-muted)] dark:text-slate-400 hover:text-[var(--primary)] dark:hover:text-white shadow-sm border border-[var(--card-border)] dark:border-slate-700"}`} title="Dictar por voz">
                                            {isListening && <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />}
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
