'use client'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const handleLogin = async () => {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) alert(error.message)
        else alert('¡Bienvenido de nuevo!')
    }

    const handleGoogleLogin = async () => {
        // Esto abrirá la ventana de Google que configuramos ayer
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/auth/callback'
            }
        })
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
            <h1 className="text-3xl font-bold mb-8">SergiTask</h1>
            <div className="bg-slate-800 p-8 rounded-xl shadow-xl w-full max-w-md border border-slate-700">
                <input
                    type="email"
                    placeholder="Tu correo"
                    className="w-full p-3 mb-4 rounded bg-slate-700 border border-slate-600 outline-none focus:border-blue-500 text-white"
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Tu contraseña"
                    className="w-full p-3 mb-6 rounded bg-slate-700 border border-slate-600 outline-none focus:border-blue-500 text-white"
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    onClick={handleLogin}
                    className="w-full bg-blue-600 hover:bg-blue-700 p-3 rounded font-bold mb-4 transition"
                >
                    Iniciar Sesión
                </button>
                <div className="text-center text-slate-400 mb-4">o</div>
                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-black p-3 rounded font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition"
                >
                    Entrar con Google
                </button>
            </div>
        </div>
    )
}