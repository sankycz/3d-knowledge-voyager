"use client";

import { motion } from "framer-motion";
import { Terminal as TerminalIcon } from "lucide-react";
import { useEffect, useState, useRef } from "react";

const INITIAL_LOGS = [
  { time: "12:44:02", type: "system", msg: "Neural Voyager core initialized." },
  { time: "12:44:05", type: "update", msg: "Discovery feed updated from Nexus-01." },
  { time: "12:45:12", type: "analyze", msg: "Processing quantum coherence data packet." },
  { time: "12:46:00", type: "status", msg: "Knowledge sphere visualization refreshed." },
  { time: "12:48:22", type: "idle", msg: "Waiting for user inquiry..." },
  { time: "12:51:10", type: "warning", msg: "Latency detected in Terminal uplink." },
  { time: "12:51:15", type: "success", msg: "Rerouting via Signal-Beta." },
];

export default function ConsoleLog() {
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="flex-1 glass-panel rounded-[40px] border-none flex flex-col overflow-hidden bg-surface-low shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
      <div className="p-5 bg-white/5 flex items-center gap-3">
        <TerminalIcon size={16} className="text-text-low" />
        <span className="text-[10px] uppercase tracking-[0.3em] font-black text-text-high">Terminal Console</span>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 p-6 font-mono text-[11px] leading-relaxed space-y-4 overflow-y-auto no-scrollbar scroll-smooth"
      >
        {logs.map((log, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-4 group"
          >
            <span className="text-text-lowest shrink-0">[{log.time}]</span>
            <p className={`
              ${log.type === 'system' ? 'text-emerald-400/90' : ''}
              ${log.type === 'update' ? 'text-text-mid' : ''}
              ${log.type === 'analyze' ? 'text-primary' : ''}
              ${log.type === 'warning' ? 'text-amber-400' : ''}
              ${log.type === 'success' ? 'text-emerald-400' : ''}
              group-hover:text-white transition-colors
            `}>
              <span className="text-text-lowest mr-2 font-black tracking-widest uppercase">[{log.type}]</span>
              {log.msg}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="p-5 mt-auto bg-white/[0.04] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_var(--color-primary)]"></div>
          <span className="text-[9px] uppercase tracking-[0.3em] text-text-low font-bold">Listening for ether...</span>
        </div>
        <div className="flex gap-1 opacity-40">
          <div className="w-1 h-3 bg-primary/40 animate-bounce [animation-delay:-0.2s]"></div>
          <div className="w-1 h-3 bg-primary/60 animate-bounce [animation-delay:-0.1s]"></div>
          <div className="w-1 h-3 bg-primary/40 animate-bounce"></div>
        </div>
      </div>
    </div>
  );
}
