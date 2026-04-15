"use client";

import { Send, Command } from "lucide-react";
import { motion } from "framer-motion";

export default function FloatingPrompt() {
  return (
    <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-full max-w-2xl px-6 z-50">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-secondary/20 to-tertiary/20 rounded-[28px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
        
        <div className="relative flex items-center bg-surface-low/80 backdrop-blur-2xl px-8 rounded-3xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-500">
          <input 
            type="text" 
            placeholder="Inquire the ether..." 
            className="w-full bg-transparent border-none py-6 text-on-surface font-sans text-sm placeholder:text-text-low focus:ring-0 outline-none"
          />
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
              <span className="text-[10px] font-black tracking-widest text-text-low flex items-center gap-1 uppercase">
                <Command size={10} />
                <span>K</span>
              </span>
            </div>
            
            <button className="w-10 h-10 flex items-center justify-center bg-primary text-background rounded-2xl active:scale-90 transition-all duration-300 shadow-[0_0_20px_rgba(164,230,255,0.3)] hover:shadow-[0_0_30px_rgba(164,230,255,0.5)]">
              <Send size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
