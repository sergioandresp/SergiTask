// @ts-nocheck
"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Send, Compass, User, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useVoice } from "@/hooks/useVoice";

interface SergiplotProps {
    objectiveTitle: string;
    onApproveTasks: (tasks: string[]) => void;
}

export default function Sergiplot({ objectiveTitle, onApproveTasks }: SergiplotProps) {
    const [messages, setMessages] = useState<any[]>([
        {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `¡Hola! Soy Sergiplot. Veo que estás trabajando en "${objectiveTitle}". ¿Qué parte específica necesitas organizar ahora o qué has avanzado hasta el momento?`
        }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [input, setInput] = useState("");

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { isListening, toggleListen } = useVoice(input, setInput);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
    };

    const handleFormSubmit = async () => {
        if (!input.trim() || isLoading) return;
        if (isListening) toggleListen();

        const userMessage = { id: crypto.randomUUID(), role: "user", content: input };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput("");
        setIsLoading(true);

        try {
            const payloadMessages = updatedMessages.map(m => ({
                role: m.role,
                content: m.content || ""
            })).filter(m => m.content !== "");

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: payloadMessages,
                    objectiveTitle
                })
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(prev => [...prev, {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    content: data.text,
                    toolInvocations: data.toolInvocations
                }]);
            } else {
                console.error("[CHAT_FETCH_ERROR]: Status", response.status);
            }
        } catch (error) {
            console.error("[CHAT_FETCH_ERROR]:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleFormSubmit();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleFormSubmit();
        }
    };

    return (
        <div className="bg-[var(--background)] border border-[var(--primary)]/30 rounded-xl overflow-hidden mt-4 flex flex-col shadow-inner max-h-[500px]">
            <div className="bg-[var(--primary)]/10 px-4 py-3 border-b border-[var(--primary)]/20 flex items-center gap-2">
                <Compass size={18} className="text-[var(--primary)]" />
                <span className="font-semibold text-[var(--primary)] text-sm">Sergiplot (Consultor IA)</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                    {messages.map((msg: any) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === "assistant" || msg.role === "system" ? "bg-[var(--primary)] text-white" : "bg-[var(--card-border)] text-[var(--foreground)]"}`}>
                                {msg.role === "assistant" || msg.role === "system" ? <Compass size={16} /> : <User size={16} />}
                            </div>

                            <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                {msg.content && (
                                    <div className={`p-3 rounded-2xl text-sm ${msg.role === "user"
                                        ? "bg-[var(--foreground)] text-[var(--background)] rounded-tr-sm"
                                        : "bg-[var(--card-bg)] border border-[var(--card-border)] rounded-tl-sm text-[var(--foreground)]"
                                        }`}>
                                        {msg.content}
                                    </div>
                                )}

                                
                            </div>
                        </motion.div>
                    ))}
                    {isLoading && messages[messages.length - 1]?.role === "user" && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[85%]">
                            <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shrink-0">
                                <Compass size={16} />
                            </div>
                            <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl rounded-tl-sm p-3 flex gap-1 items-center">
                                <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce"></span>
                                <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                                <span className="w-1.5 h-1.5 bg-[var(--primary)] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />

            </div>

            <form onSubmit={onFormSubmit} className="p-3 bg-[var(--card-bg)] border-t border-[var(--card-border)] flex gap-2 items-end">
                <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); toggleListen(); }}
                    className={`p-3 rounded-full transition-all flex items-center justify-center relative ${isListening
                        ? "bg-red-500/10 text-red-500"
                        : "bg-[var(--card-border)] text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10"
                        }`}
                    title="Hablar (Dictado de voz)"
                >
                    {isListening && (
                        <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping"></span>
                    )}
                    <Mic size={20} className={isListening ? "text-red-500 relative z-10" : "relative z-10"} />
                </button>

                <textarea
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={isListening ? "Escuchando..." : "Escribe o usa tu voz..."}
                    className="flex-1 bg-transparent border-0 focus:ring-0 resize-none max-h-32 text-sm py-3 px-2 text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none"
                    rows={1}
                />

                <button
                    type="submit"
                    disabled={!(input || "").trim() || isLoading}
                    className="p-3 bg-[var(--primary)] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--primary-hover)] transition-colors"
                >
                    <Send size={20} className="ml-1" />
                </button>
            </form>
        </div>
    );
}
