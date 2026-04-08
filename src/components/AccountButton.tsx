"use client";

import { useState } from "react";
import { User, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";
import AuthModal from "./AuthModal";

export default function AccountButton() {
  const { user, loading, signOut } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full border border-white/20 animate-pulse bg-white/5 pointer-events-auto" />
    );
  }

  return (
    <>
      {!user ? (
        // Extrémně jednoduché, explicitní html tlačítko bez zanořování do mnoha gridů apod. z důvodu zabránění blokace eventu
        <button 
          id="auth-login-trigger"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setModalOpen(true);
          }}
          style={{ pointerEvents: 'auto', zIndex: 9999, cursor: 'pointer' }}
          className="group relative flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#00d1ff]/20 to-[#9d00ff]/20 hover:from-[#00d1ff]/40 hover:to-[#9d00ff]/40 border border-white/20 hover:border-white/50 text-white font-bold tracking-widest text-[10px] uppercase shadow-[0_0_20px_rgba(0,209,255,0.3)] transition-all pointer-events-auto"
        >
          <div className="absolute inset-0 rounded-full bg-white/10 blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <User size={16} className="text-[#00d1ff] pointer-events-none" />
          <span className="pointer-events-none">Přihlásit se</span>
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

      <AuthModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
