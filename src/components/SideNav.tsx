"use client";

import { 
  LayoutGrid, 
  Globe, 
  Terminal as TerminalIcon, 
  Library, 
  Sensors,
  HelpCircle,
  LogOut,
  Plus
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function SideNav() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-40 bg-background/60 backdrop-blur-2xl hidden md:flex flex-col p-6 gap-10 pt-24 border-none transition-all duration-500 ease-out">
      {/* User Profile Hook */}
      <div className="flex flex-col gap-1 px-2">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-surface-highest overflow-hidden p-0.5 shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
            <img 
              src="/Users/sankycz/.gemini/antigravity/brain/d52ef4ad-f7f7-40c9-8fd3-249539940e6f/voyager_avatar_1776257947522.png" 
              alt="Voyager Explorer"
              className="w-full h-full rounded-[14px] object-cover"
            />
          </div>
          <div>
            <h3 className="text-on-surface font-display font-bold text-sm tracking-tight">Voyager-01</h3>
            <p className="text-primary text-[9px] uppercase tracking-[0.2em] font-black">System Active</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-2">
        <SideLink icon={<LayoutGrid size={18} />} label="Neural Feed" active />
        <SideLink icon={<Globe size={18} />} label="Cosmos" />
        <SideLink icon={<TerminalIcon size={18} />} label="Terminal" />
        <SideLink icon={<Library size={18} />} label="Library" />
        <SideLink icon={<Sensors size={18} />} label="Signals" />
      </nav>

      <div className="mt-auto flex flex-col gap-4">
        <button className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-background font-bold rounded-2xl text-[10px] uppercase tracking-[0.2em] active:scale-95 transition-transform shadow-[0_15px_35px_rgba(164,230,255,0.2)] hover:shadow-[0_20px_45px_rgba(164,230,255,0.3)] duration-500">
          <div className="flex items-center justify-center gap-2">
            <Plus size={14} strokeWidth={3} />
            <span>New Inquiry</span>
          </div>
        </button>
        
        <div className="flex flex-col gap-2 pt-8 mt-4 bg-gradient-to-t from-surface-low/20 to-transparent">
          <Link href="#" className="flex items-center gap-4 px-3 py-2 text-text-low hover:text-text-high transition-colors text-[10px] uppercase tracking-[0.2em] font-bold">
            <HelpCircle size={16} />
            <span>Support</span>
          </Link>
          <Link href="#" className="flex items-center gap-4 px-3 py-2 text-text-low hover:text-red-400 transition-colors text-[10px] uppercase tracking-[0.2em] font-bold">
            <LogOut size={16} />
            <span>Sign Out</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

function SideLink({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <Link 
      href="#" 
      className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-500 ease-out text-[10px] uppercase tracking-[0.2em] font-bold ${
        active 
          ? "text-primary bg-primary/5 shadow-[inset_0_0_20px_rgba(164,230,255,0.03)]" 
          : "text-text-low hover:bg-white/5 hover:text-text-mid"
      }`}
    >
      <span className={active ? "text-primary" : "text-text-low"}>{icon}</span>
      <span>{label}</span>
      {active && <motion.div layoutId="active-pill" className="ml-auto w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />}
    </Link>
  );
}
