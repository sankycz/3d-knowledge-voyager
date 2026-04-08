"use client";

import { User, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-[14px] h-[14px]">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
  </svg>
);

export default function AccountButton() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full border border-white/20 animate-pulse bg-white/5 pointer-events-auto" />
      </div>
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
          className="group relative flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 text-white font-bold tracking-widest text-[10px] uppercase shadow-lg transition-all pointer-events-auto overflow-hidden"
        >
          {/* Subtle glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#ea4335]/10 to-[#4285F4]/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          {/* Google Icon with circular background */}
          <div className="relative flex items-center justify-center p-1.5 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors pointer-events-none shadow-sm shadow-black/20">
            <GoogleIcon />
          </div>
          
          <span className="pointer-events-none pr-1">Přihlásit přes Google</span>
        </button>
      ) : (
        <div className="flex items-center gap-4 pointer-events-auto">
          <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full border border-white/20 shadow-[0_0_15px_rgba(0,209,255,0.15)] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#00d1ff]/5 to-transparent pointer-events-none" />
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="relative w-8 h-8 rounded-full shadow-[0_0_10px_rgba(0,209,255,0.3)] border border-white/10" />
            ) : (
              <div className="relative w-8 h-8 rounded-full flex items-center justify-center bg-[#00d1ff]/30 text-[#00d1ff] font-bold border border-[#00d1ff]/50">
                <User size={16} />
              </div>
            )}
            <span className="relative text-[10px] font-black uppercase tracking-widest text-white/90">
              {user.displayName?.split(" ")[0] || "Uživatel"}
            </span>
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              signOut();
            }}
            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
            className="p-3 rounded-full bg-red-500/10 hover:bg-red-500/30 border border-red-500/30 text-red-400 hover:text-white transition-all shadow-lg pointer-events-auto group"
            title="Odhlásit se"
          >
            <LogOut size={16} className="pointer-events-none group-hover:-translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}
    </>
  );
}
