"use client";

import { useState, useRef, useEffect } from "react";

export function useVoice(text: string, setText: (val: string) => void) {
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const textRef = useRef(text);

    // Keep textRef updated so we can append properly on each start
    useEffect(() => {
        textRef.current = text;
        if (text === "") {
            finalTranscriptRef.current = "";
        }
    }, [text]);

    const finalTranscriptRef = useRef("");

    useEffect(() => {
        if (typeof window !== "undefined" && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = "es-ES";

            recognitionRef.current.onstart = () => {
                // Initialize the final transcript with whatever text is already in the input
                finalTranscriptRef.current = (textRef.current || "").trim();
                if (finalTranscriptRef.current) {
                    finalTranscriptRef.current += " ";
                }
            };

            recognitionRef.current.onresult = (event: any) => {
                let interimTranscript = "";
                let newFinals = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        newFinals += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (newFinals) {
                    finalTranscriptRef.current += newFinals;
                }

                // Call setText with the fully updated string
                setText(finalTranscriptRef.current + interimTranscript);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [setText]);

    const toggleListen = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                    setIsListening(true);
                } catch (e) {
                    console.error("Error al iniciar el reconocimiento de voz:", e);
                }
            } else {
                alert("Tu navegador no soporta el reconocimiento de voz.");
            }
        }
    };

    return { isListening, toggleListen };
}
