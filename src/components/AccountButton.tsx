"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogOut, User, ShieldCheck, ShieldAlert } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 48 48">
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
      <div className="flex items-center gap-3 px-6 py-3 rounded-2xl animate-pulse bg-surface-low">
        <div className="w-8 h-8 rounded-full bg-surface-mid" />
        <div className="w-20 h-2 bg-surface-mid rounded" />
      </div>
    );
  }

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.button 
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={() => signIn()}
            className="group relative flex items-center gap-6 px-10 py-4 rounded-[24px] bg-surface-low/80 hover:bg-surface-mid transition-all shadow-2xl overflow-hidden border-none backdrop-blur-md"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative flex items-center justify-center p-3 rounded-2xl bg-surface-high group-hover:bg-primary/20 transition-all duration-500">
              <GoogleIcon />
            </div>
            
            <div className="flex flex-col items-start leading-none gap-2">
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white group-hover:text-primary transition-colors">Access Portal</span>
              <span className="text-[9px] font-mono text-text-lowest tracking-[0.1em] uppercase opacity-60">System_Auth_Required</span>
            </div>
            
            <ShieldAlert size={14} className="text-text-low group-hover:text-primary transition-colors ml-2" />
          </motion.button>
        ) : (
          <motion.div 
            key="account"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-5 bg-surface-low/60 px-8 py-4 rounded-[24px] shadow-2xl relative overflow-hidden group backdrop-blur-md">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full shadow-2xl relative z-10 brightness-90 group-hover:brightness-110 transition-all border-none" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary relative z-10 border-none">
                  <User size={18} />
                </div>
              )}
              
              <div className="flex flex-col relative z-10 gap-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-black uppercase tracking-[0.2em] text-on-surface leading-none">{user.displayName?.split(" ")[0] || "OPERATOR"}</span>
                  <ShieldCheck size={12} className="text-primary opacity-80" />
                </div>
                <span className="text-[9px] font-mono text-text-lowest uppercase tracking-[0.4em] opacity-40">LvL_05_Clearance</span>
              </div>
            </div>

            <button 
              onClick={() => signOut()}
              className="w-14 h-14 rounded-full bg-surface-low/40 hover:bg-red-500/10 text-text-low hover:text-red-400 transition-all group flex items-center justify-center border-none backdrop-blur-sm"
              title="Deactivate Session"
            >
              <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
