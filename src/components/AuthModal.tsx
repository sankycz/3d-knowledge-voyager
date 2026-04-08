// src/components/AuthModal.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, User, Zap, AlertCircle, Loader2 } from "lucide-react";
import { FaGoogle } from "react-icons/fa";
import { useState } from "react";
import { registerWithEmail, loginWithEmail, signInWithGoogle } from "@/lib/firebase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "Tento e-mail je již zaregistrován.",
  "auth/weak-password": "Heslo musí mít alespoň 6 znaků.",
  "auth/invalid-email": "Neplatná e-mailová adresa.",
  "auth/user-not-found": "Účet nenalezen. Zkontrolujte e-mail.",
  "auth/wrong-password": "Nesprávné heslo.",
  "auth/invalid-credential": "Nesprávný e-mail nebo heslo.",
  "auth/too-many-requests": "Příliš mnoho pokusů. Zkuste to za chvíli.",
  "auth/operation-not-allowed": "Email/heslo přihlášení není povoleno. Kontaktujte správce.",
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setDisplayName("");
    setError("");
  };

  const switchMode = (newMode: "login" | "register") => {
    setMode(newMode);
    setError("");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      if (mode === "register") {
        await registerWithEmail(email, password, displayName);
      } else {
        await loginWithEmail(email, password);
      }
      resetForm();
      onClose();
    } catch (err: any) {
      const code = err?.code as string;
      setError(FIREBASE_ERROR_MESSAGES[code] || `Chyba: ${code || "Neznámá chyba"}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      onClose();
    } catch {
      setError("Google přihlášení selhalo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120]"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[130] cyber-glass p-8 rounded-[32px] border border-white/10 shadow-2xl"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={14} className="text-[#00d1ff] animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#00d1ff]">
                    VOYAGER PŘÍSTUP
                  </span>
                </div>
                <h2 className="text-2xl font-display font-bold text-white">
                  {mode === "login" ? "Přihlášení" : "Registrace"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-full text-neutral-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="flex bg-white/[0.03] rounded-2xl p-1 mb-6 border border-white/5">
              {(["login", "register"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${
                    mode === m
                      ? "bg-[#00d1ff]/20 text-[#00d1ff] border border-[#00d1ff]/30"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {m === "login" ? "Přihlásit se" : "Registrovat"}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              {mode === "register" && (
                <div className="relative">
                  <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jméno (volitelně)"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 pl-10 outline-none focus:border-[#00d1ff]/50 transition-all text-white text-sm placeholder:text-neutral-600"
                  />
                </div>
              )}
              <div className="relative">
                <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 pl-10 outline-none focus:border-[#00d1ff]/50 transition-all text-white text-sm placeholder:text-neutral-600"
                />
              </div>
              <div className="relative">
                <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Heslo"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 pl-10 outline-none focus:border-[#00d1ff]/50 transition-all text-white text-sm placeholder:text-neutral-600"
                />
              </div>

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-red-400 text-xs"
                >
                  <AlertCircle size={14} />
                  {error}
                </motion.div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#00d1ff]/20 hover:bg-[#00d1ff]/30 border border-[#00d1ff]/40 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Zap size={14} className="text-[#00d1ff]" />
                )}
                {mode === "login" ? "Přihlásit se" : "Vytvořit účet"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600">nebo</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={isLoading}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <FaGoogle size={14} className="text-[#ea4335]" />
              Pokračovat s Google
            </button>

            {/* Footer */}
            <p className="text-[9px] font-black text-neutral-700 uppercase tracking-[0.2em] text-center mt-6">
              VOYAGER INTELLIGENCE NETWORK
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
