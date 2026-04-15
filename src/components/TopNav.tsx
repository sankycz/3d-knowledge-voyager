"use client";

import { Activity, Settings } from "lucide-react";
import AccountButton from "./AccountButton";
import Link from "next/link";
import { motion } from "framer-motion";

export default function TopNav() {
  return (
    <nav className="fixed top-0 w-full z-[100] bg-background/50 backdrop-blur-2xl flex justify-between items-center px-10 py-5 border-none shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
      <div className="flex items-center gap-4">
        <div className="text-xl font-bold tracking-[0.3em] text-primary font-display uppercase">
          Knowledge Voyager
        </div>
      </div>

      <div className="hidden md:flex items-center gap-10">
        <Link href="#" className="text-sm font-bold tracking-[0.2em] text-primary/80 hover:text-primary transition-colors uppercase">
          Nexus
        </Link>
        <Link href="#" className="text-sm font-bold tracking-[0.2em] text-text-low hover:text-primary transition-colors uppercase">
          Archives
        </Link>
        <Link href="#" className="text-sm font-bold tracking-[0.2em] text-text-low hover:text-primary transition-colors uppercase">
          Discovery
        </Link>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-text-low hover:text-primary transition-all active:scale-90 duration-300 p-2 hover:bg-white/5 rounded-xl">
          <Settings size={20} />
        </button>
        <AccountButton />
      </div>
    </nav>
  );
}
