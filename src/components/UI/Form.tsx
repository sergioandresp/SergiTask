"use client";

import { useState } from "react";
import { CalendarClock } from "lucide-react";

interface FormProps {
    onAdd: (text: string, dueDate?: number) => void;
    placeholder: string;
    buttonText: string;
    className?: string;
    showDateInput?: boolean;
}

export default function Form({ onAdd, placeholder, buttonText, className = "mb-8", showDateInput = false }: FormProps) {
    const [text, setText] = useState("");
    const [date, setDate] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            const parsedDate = date ? new Date(date + "T12:00:00").getTime() : undefined;
            onAdd(text.trim(), parsedDate);
            setText("");
            setDate("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className={`flex flex-col sm:flex-row gap-3 ${className}`}>
            <div className="flex-1 flex bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl relative shadow-sm transition-all focus-within:ring-2 focus-within:ring-[var(--primary)] focus-within:border-transparent">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 px-4 py-3 bg-transparent text-[var(--foreground)] placeholder-transparent sm:placeholder-[var(--text-muted)] focus:outline-none"
                />

                {showDateInput && (
                    <div className="relative flex items-center pr-3 border-l border-[var(--card-border)] ml-2 pl-3 group/date">
                        <CalendarClock size={18} className={`transition-colors ${date ? "text-[var(--primary)]" : "text-[var(--text-muted)] group-hover/date:text-[var(--primary)]"}`} />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            title="Añadir fecha límite"
                        />
                        {date && (
                            <span className="ml-2 text-xs font-semibold text-[var(--primary)] whitespace-nowrap hidden sm:block">
                                {new Date(date + "T12:00:00").toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                            </span>
                        )}
                    </div>
                )}
            </div>
            <button
                type="submit"
                disabled={!text.trim()}
                className="px-6 py-3 bg-[var(--primary)] text-white rounded-xl font-medium hover:bg-[var(--primary-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-95 whitespace-nowrap"
            >
                {buttonText}
            </button>
        </form>
    );
}
