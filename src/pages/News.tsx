import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Newspaper, Calendar, ArrowRight, Share2, Heart, Megaphone, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';

export default function News() {
  const navigate = useNavigate();
  const { news } = useApp();
  const [activeTab, setActiveTab] = useState<'semua' | 'berita' | 'pengumuman'>('semua');

  // Since news from context is unified, we treat them as 'berita' or 'pengumuman' based on category
  const filteredData = activeTab === 'semua' 
    ? news 
    : news.filter(item => {
        if (activeTab === 'pengumuman') return item.category === 'PENGUMUMAN';
        return item.category !== 'PENGUMUMAN';
      });

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="bg-primary p-6 pt-10 text-white relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-300/20 rounded-full -ml-12 -mb-12 blur-2xl"></div>
        <div className="flex items-center gap-4 relative z-10 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/20 hover:bg-white/30 rounded-2xl backdrop-blur-md transition-all active:scale-95"><ChevronLeft size={20} /></button>
          <div className="flex flex-col">
            <h2 className="text-xl font-black italic tracking-tight uppercase">Kabar Sekolah</h2>
            <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Informasi Terkini</p>
          </div>
        </div>
        <div className="flex p-1 bg-white/10 backdrop-blur-md rounded-2xl relative z-10 font-black uppercase">
          {['semua', 'berita', 'pengumuman'].map((id) => (
            <button key={id} onClick={() => setActiveTab(id as any)} className={`flex-1 py-2 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all relative z-10 ${activeTab === id ? 'text-primary' : 'text-white/70'}`}>
              {activeTab === id && <motion.div layoutId="tab" className="absolute inset-0 bg-white rounded-xl -z-10" />}
              {id}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          <div className="space-y-6">
            {filteredData.map((item, idx) => {
              const isP = item.category === 'PENGUMUMAN';
              return (
                <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.05 }}
                  className={`${isP ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'} rounded-[2.5rem] overflow-hidden shadow-xl border flex flex-col group cursor-pointer active:scale-[0.98] transition-all`}
                >
                  {item.image && (
                    <div className="w-full aspect-video overflow-hidden">
                      <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title} />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${isP ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-sky-600'}`}>
                          {isP ? <Bell size={14} /> : <Newspaper size={14} />}
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isP ? 'text-amber-600' : 'text-sky-600'}`}>{isP ? 'Pengumuman' : item.category}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400">
                        <Calendar size={10} /><span className="text-[9px] font-bold uppercase tracking-tighter">{item.date}</span>
                      </div>
                    </div>
                    <h3 className={`text-lg font-black italic leading-tight mb-3 uppercase tracking-tight ${isP ? 'text-amber-900' : 'text-gray-800'}`}>{item.title}</h3>
                    <p className={`text-sm leading-relaxed mb-4 font-medium italic ${isP ? 'text-amber-700/70' : 'text-gray-500'}`}>"{item.content}"</p>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4"><Share2 size={16} className="text-gray-300" /><Heart size={16} className="text-gray-300" /></div>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isP ? 'bg-amber-200 text-amber-700' : 'bg-blue-50 text-primary'}`}><ArrowRight size={16} /></div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
        {filteredData.length === 0 && <div className="py-20 text-center text-gray-400 uppercase font-black text-[10px] italic">Belum ada {activeTab} terbaru</div>}
      </div>
    </div>
  );
}
