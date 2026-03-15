"use client";

import { Reorder } from "framer-motion";
import { MacroObjective } from "@/types";
import Form from "../UI/Form";
import ObjectiveItem from "./ObjectiveItem";
import { Target } from "lucide-react";

interface ObjectiveListProps {
    objectives: MacroObjective[];
    onAdd: (title: string) => void;
    onUpdate: (updated: MacroObjective) => void;
    onDelete: (id: string) => void;
    onReorder: (newOrder: MacroObjective[]) => void;
    selectedDate: Date | null;
    onClearDate: () => void;
}

export default function ObjectiveList({
    objectives,
    onAdd,
    onUpdate,
    onDelete,
    onReorder,
    selectedDate,
}: ObjectiveListProps) {
    const totalObjectives = objectives.length;
    const completelyDone = objectives.filter(
        (o) => o.tasks.length > 0 && o.tasks.every((t) => t.completed)
    ).length;

    return (
        <div className="w-full max-w-3xl mx-auto antialiased">
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)] flex flex-wrap items-center gap-3">
                        Mis Objetivos
                    </h2>
                    {totalObjectives > 0 && (
                        <span className="bg-[var(--primary)]/10 text-[var(--primary)] px-4 py-1.5 rounded-full text-sm font-semibold max-w-fit">
                            {completelyDone}/{totalObjectives} Completados
                        </span>
                    )}
                </div>
            </div>

            <Form
                onAdd={onAdd}
                placeholder="¿Cuál es tu nuevo macro-objetivo? (Ej: Redactar Paper)"
                buttonText="Añadir Objetivo"
            />

            {objectives.length === 0 ? (
                <div className="text-center py-16 text-[var(--text-muted)] flex flex-col items-center">
                    <Target size={48} className="mb-4 opacity-50" />
                    <p className="text-lg">
                        No hay macro-objetivos aún. ¡Añade uno arriba!
                    </p>
                </div>
            ) : (
                <Reorder.Group
                    axis="y"
                    values={objectives}
                    onReorder={onReorder}
                    className="space-y-4 list-none p-0"
                >
                    {objectives.map((obj) => (
                        <ObjectiveItem
                            key={obj.id}
                            objective={obj}
                            onUpdate={onUpdate}
                            onDelete={onDelete}
                            selectedDate={selectedDate}
                        />
                    ))}
                </Reorder.Group>
            )}
        </div>
    );
}
