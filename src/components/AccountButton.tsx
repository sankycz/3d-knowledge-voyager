"use client";

import { User, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { FaGoogle } from "react-icons/fa";

export default function AccountButton() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full border border-white/20 animate-pulse bg-white/5 pointer-events-auto" />
    );
  }

  return (
    <>
      {!user ? (
        <button 
          id="auth-login-trigger"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await signIn();
          }}
          style={{ pointerEvents: 'auto', zIndex: 9999, cursor: 'pointer' }}
          className="group relative flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-white/5 to-white/10 hover:from-white/10 hover:to-white/20 border border-white/20 hover:border-[#ea4335]/50 text-white font-bold tracking-widest text-[10px] uppercase shadow-lg transition-all pointer-events-auto"
        >
          <div className="absolute inset-0 rounded-full bg-[#ea4335]/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <FaGoogle size={14} className="text-[#ea4335] pointer-events-none" />
          <span className="pointer-events-none">Přihlásit přes Google</span>
        </button>
      ) : (
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full border border-white/20 shadow-[0_0_15px_rgba(0,209,255,0.2)]">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full shadow-[0_0_10px_rgba(0,209,255,0.5)]" />
            ) : (
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#00d1ff]/30 text-[#00d1ff] font-bold">
                {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <span className="text-[10px] font-black uppercase tracking-widest text-white/90">{user.displayName || "Uživatel"}</span>
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              signOut();
            }}
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            className="p-3 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 text-white transition-all hover:scale-110 shadow-lg pointer-events-auto"
            title="Odhlásit"
          >
            <LogOut size={16} className="pointer-events-none" />
          </button>
        </div>
      )}
    </>
  );
}
