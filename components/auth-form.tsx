"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowRight, CheckCircle2, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthForm({ mode }: { mode: "login" | "registro" }) {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [visible, setVisible] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const router = useRouter(); const isSignup = mode === "registro";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const supabase = createClient();
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ? process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL : `${window.location.origin}/auth/callback` } });
        if (error) { setMessage(error.message.includes("Password") ? "La contraseña debe tener al menos 6 caracteres." : "No se pudo crear la cuenta. Revisa tus datos e inténtalo de nuevo."); return; }
        if (!data.session) { setMessage("Cuenta creada. Confirma tu correo para iniciar sesión."); return; }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setMessage(error.message.toLowerCase().includes("confirm") ? "Confirma tu correo antes de iniciar sesión." : "Correo o contraseña incorrectos."); return; }
      }
      router.replace("/dashboard"); router.refresh();
    } catch { setMessage("No se pudo completar la solicitud. Inténtalo más tarde."); } finally { setBusy(false); }
  }
  return <div className="auth-card">
    <Link href="/" className="flex items-center gap-3 text-sm font-bold text-slate-800 no-underline"><span className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-lg text-white">T</span>TaskFlow</Link>
    <div className="mt-12"><p className="text-xs font-semibold uppercase tracking-[.18em] text-indigo-600">Tu espacio, en orden</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">{isSignup ? "Crea tu cuenta" : "Qué bueno verte"}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{isSignup ? "Empieza a organizar tus tareas de forma sencilla." : "Inicia sesión para continuar con tu día."}</p></div>
    <form className="mt-8 flex flex-col gap-5" onSubmit={submit}>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Correo electrónico<span className="relative"><Mail className="absolute left-3 top-3.5 size-4 text-slate-400"/><input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"/></span></label>
      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">Contraseña<span className="relative"><LockKeyhole className="absolute left-3 top-3.5 size-4 text-slate-400"/><input required minLength={6} type={visible?"text":"password"} autoComplete={isSignup?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"/><button type="button" aria-label={visible?"Ocultar contraseña":"Mostrar contraseña"} onClick={()=>setVisible(!visible)} className="absolute right-3 top-3 text-slate-400">{visible?<EyeOff className="size-4"/>:<Eye className="size-4"/>}</button></span></label>
      {message && <p role="status" className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800">{message}</p>}
      <Button type="submit" disabled={busy} className="h-11 rounded-xl bg-indigo-600 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700">{busy?"Un momento…":isSignup?"Crear cuenta":"Iniciar sesión"}<ArrowRight data-icon="inline-end"/></Button>
    </form>
    <p className="mt-6 text-center text-sm text-slate-500">{isSignup?"¿Ya tienes cuenta?":"¿Aún no tienes cuenta?"} <Link className="font-semibold text-indigo-600 hover:text-indigo-800" href={isSignup?"/login":"/registro"}>{isSignup?"Inicia sesión":"Regístrate"}</Link></p>
    <p className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400"><CheckCircle2 className="size-4"/>Tus tareas son privadas y seguras.</p>
  </div>;
}
