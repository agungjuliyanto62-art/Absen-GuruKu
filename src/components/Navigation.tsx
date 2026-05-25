import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ClipboardList, Fingerprint } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { motion } from 'motion/react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:absolute bg-white border-t border-gray-100 flex justify-around items-center h-24 px-4 z-[100] pb-6">
      <NavLink 
        to="/" 
        className={({ isActive }) => cn(
          "flex flex-col items-center gap-1 transition-colors",
          isActive ? "text-blue-600" : "text-gray-400"
        )}
      >
        <Home size={28} strokeWidth={1.5} />
        <span className="text-[12px] font-bold uppercase tracking-tight">BERANDA</span>
      </NavLink>

      <div className="relative -top-10">
        <NavLink 
          to="/absensi"
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-full border-[6px] border-white shadow-[0_10px_30px_rgba(37,99,235,0.3)] flex items-center justify-center text-white transition-transform active:scale-90 overflow-hidden relative">
             <Fingerprint size={48} strokeWidth={1.5} className="relative z-10" />
             {/* Scan Line Effect */}
             <motion.div 
               initial={{ top: '110%', opacity: 0 }}
               animate={{ 
                 top: ['110%', '-10%'],
                 opacity: [0, 1, 1, 0]
               }}
               transition={{ 
                 duration: 2, 
                 repeat: Infinity, 
                 ease: "linear" 
               }}
               className="absolute left-0 right-0 h-[2px] bg-white/80 blur-[1px] shadow-[0_0_10px_rgba(255,255,255,1)] z-20"
             />
          </div>
          <span className="text-[12px] font-black uppercase tracking-tight text-slate-500 mt-2">ABSENSI</span>
        </NavLink>
      </div>

      <NavLink 
        to="/history" 
        className={({ isActive }) => cn(
          "flex flex-col items-center gap-1 transition-colors",
          isActive ? "text-blue-600" : "text-gray-400"
        )}
      >
        <ClipboardList size={28} strokeWidth={1.5} />
        <span className="text-[12px] font-bold uppercase tracking-tight whitespace-nowrap">DATA ABSENSI</span>
      </NavLink>
    </nav>
  );
}

