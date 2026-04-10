"use client";

import { User, LogOut, ShieldCheck, ShieldAlert } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { motion, AnimatePresence } from "framer-motion";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-[14px] h-[14px]">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.002,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

export default function AccountButton() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-2xl animate-pulse">
        <div className="w-8 h-8 rounded-full bg-white/10" />
        <div className="w-20 h-2 bg-white/10 rounded" />
      </div>
    );
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.button 
            key="login"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => signIn()}
            className="group relative flex items-center gap-4 px-8 py-3 rounded-2xl bg-black/40 backdrop-blur-3xl border border-white/10 hover:border-[#00ffff]/40 transition-all shadow-2xl overflow-hidden tech-corners"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#ea4335]/5 via-transparent to-[#4285F4]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative flex items-center justify-center p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors shadow-inner">
              <GoogleIcon />
            </div>
            
            <div className="flex flex-col items-start leading-none group">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/90 group-hover:text-white transition-colors">Přihlásit se</span>
              <span className="text-[8px] font-mono text-neutral-500 mt-1">VOYAGER_ACCESS_PROTO_v4</span>
            </div>
            
            <ShieldAlert size={14} className="text-neutral-700 group-hover:text-red-500/50 transition-colors ml-2" />
          </motion.button>
        ) : (
          <motion.div 
            key="account"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-5"
          >
            <div className="flex items-center gap-4 bg-black/60 backdrop-blur-3xl px-6 py-3 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,255,255,0.05)] relative overflow-hidden group tech-corners">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00ffff]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-white/10 shadow-lg relative z-10" />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#00ffff]/20 text-[#00ffff] border border-[#00ffff]/30 relative z-10">
                  <User size={16} />
                </div>
              )}
              
              <div className="flex flex-col relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-widest text-white">{user.displayName?.split(" ")[0] || "OPERÁTOR"}</span>
                  <ShieldCheck size={10} className="text-[#00ffa3]" />
                </div>
                <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest">Clearance Level 5</span>
              </div>
            </div>

            <button 
              onClick={() => signOut()}
              className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/40 text-neutral-500 hover:text-red-400 transition-all shadow-xl group"
              title="Odhlásit Protocol"
            >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
