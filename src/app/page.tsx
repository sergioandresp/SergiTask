"use client";

import { useState, useEffect, useMemo } from "react";
import ObjectiveList from "@/components/Objectives/ObjectiveList";
import CalendarSidebar from "@/components/UI/CalendarSidebar";
import DueDateAlerts from "@/components/UI/DueDateAlerts";
import FocusModal from "@/components/UI/FocusModal";
import { MacroObjective } from "@/types";
import { Target, Menu, Sun, Moon } from "lucide-react";

export default function Home() {
  const [objectives, setObjectives] = useState<MacroObjective[]>([]);
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [focusViewOffset, setFocusViewOffset] = useState<0 | 1>(0);
  const [isDailyFocusOpen, setIsDailyFocusOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("macro-objectives");
    if (saved) {
      try { setObjectives(JSON.parse(saved)); } catch { console.error("Failed to parse objectives"); }
    }
    // Sync isDark with what the inline script in layout already applied
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("macro-objectives", JSON.stringify(objectives));
  }, [objectives, mounted]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("sergiTask-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("sergiTask-theme", "light");
    }
  };

  // ── Focus tasks ──────────────────────────────────────────────
  const focusTasks = useMemo(() => {
    const now = new Date();
    const targetDay = new Date(
      now.getFullYear(), now.getMonth(), now.getDate() + focusViewOffset
    ).getTime();

    const result = [];

    for (const obj of objectives) {
      if (obj.plannedDate === targetDay) {
        result.push({
          taskId: obj.id,
          objectiveId: obj.id,
          taskText: obj.title,
          objectiveTitle: "Macro-Objetivo",
          completed: !!obj.completedAt,
        });
      }
      for (const task of obj.tasks) {
        if (task.plannedDate === targetDay) {
          result.push({
            taskId: task.id,
            objectiveId: obj.id,
            taskText: task.text,
            objectiveTitle: obj.title,
            completed: task.completed,
          });
        }
      }
    }
    return result;
  }, [objectives, focusViewOffset]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleAddObjective = (title: string) => {
    const newObjective: MacroObjective = {
      id: crypto.randomUUID(), title, tasks: [], createdAt: Date.now(),
    };
    setObjectives(prev => [newObjective, ...prev]);
  };

  const handleUpdateObjective = (updated: MacroObjective) => {
    setObjectives(prev => prev.map(obj => obj.id === updated.id ? updated : obj));
  };

  const handleDeleteObjective = (id: string) => {
    setObjectives(prev => prev.filter(obj => obj.id !== id));
  };

  const handleReorderObjectives = (newOrder: MacroObjective[]) => {
    setObjectives(newOrder);
  };

  const handleToggleFocusTask = (taskId: string, objectiveId: string) => {
    setObjectives(prev => prev.map(obj => {
      if (obj.id !== objectiveId) return obj;
      if (taskId === objectiveId) {
        const nowDone = !obj.completedAt;
        return { ...obj, completedAt: nowDone ? Date.now() : undefined };
      }
      return {
        ...obj,
        tasks: obj.tasks.map(t => {
          if (t.id !== taskId) return t;
          return { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined };
        }),
      };
    }));
  };

  if (!mounted) {
    return (
      <div className="w-full min-h-screen flex justify-center items-center py-20 opacity-50 bg-[var(--background)]">
        <Target size={32} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 border-b border-[var(--card-border)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-[100] flex items-center justify-between px-4 sm:px-6 pointer-events-auto shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
            aria-label={isSidebarOpen ? "Ocultar Sidebar" : "Ver Sidebar"}
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-3 select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="SergiTask" width={42} height={42} className="object-contain" />
            <div className="flex items-baseline gap-0">
              <span className="font-black text-2xl tracking-tight text-[#1a3347] dark:text-slate-200">Sergi</span>
              <span className="font-black text-2xl tracking-tight text-[var(--primary)]">Task</span>
            </div>
          </div>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-200"
          aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          title={isDark ? "Modo claro" : "Modo oscuro"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="flex flex-1 pt-20">
        <CalendarSidebar
          objectives={objectives}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          focusViewOffset={focusViewOffset}
          onChangeFocusView={setFocusViewOffset}
          focusTasks={focusTasks}
          onToggleFocusTask={handleToggleFocusTask}
          isDailyFocusOpen={isDailyFocusOpen}
          onToggleFocusOpen={() => setIsDailyFocusOpen(!isDailyFocusOpen)}
        />
        <main className={`flex-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full max-w-full ${isSidebarOpen ? "lg:ml-80" : "ml-0"} px-4 sm:px-8 py-4 sm:py-6 overflow-x-hidden`}>
          <div className="max-w-4xl mx-auto">
            <header className="mb-6 text-center lg:text-left flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pt-6 pb-2">
              <div>
                <h1 className="text-5xl font-bold tracking-tight text-[var(--foreground)] mb-4 leading-tight">
                  Tu Workspace Organizado
                </h1>
                <p className="text-xl font-medium text-[var(--text-muted)] max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  ¡Simplifica tu día y potencia tu enfoque!
                </p>
              </div>
            </header>

            <ObjectiveList
              objectives={objectives}
              onAdd={handleAddObjective}
              onUpdate={handleUpdateObjective}
              onDelete={handleDeleteObjective}
              onReorder={handleReorderObjectives}
              selectedDate={selectedDate}
              onClearDate={() => setSelectedDate(null)}
            />
          </div>
        </main>
      </div>
      <DueDateAlerts objectives={objectives} />

      {/* Modal de Mi Día de Enfoque */}
      <FocusModal
        isOpen={isDailyFocusOpen}
        onClose={() => setIsDailyFocusOpen(false)}
        focusTasks={focusTasks}
        onToggleTask={handleToggleFocusTask}
        focusViewOffset={focusViewOffset}
        onChangeFocusView={setFocusViewOffset}
      />
    </div>
  );
}
