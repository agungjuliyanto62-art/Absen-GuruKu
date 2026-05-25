import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Gamepad2, 
  BookOpen, 
  Search, 
  Youtube, 
  ExternalLink, 
  Globe, 
  Plus, 
  X,
  PlusCircle,
  Clock,
  User as UserIcon,
  Book,
  Camera,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../AppContext';
import { format } from 'date-fns';

function Modal({ children, onClose, title }: any) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xs font-black uppercase italic tracking-widest text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-2xl transition-colors"><X size={18} className="text-slate-400" /></button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder, icon: Icon }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black uppercase text-slate-400 italic tracking-[0.1em] ml-1">{label}</label>
      <div className="relative group">
        {Icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"><Icon size={14} /></div>}
        <input 
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-slate-50 border border-slate-100 px-4 py-3.5 rounded-2xl text-[11px] font-black italic focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600/50 transition-all ${Icon ? 'pl-11' : ''}`}
        />
      </div>
    </div>
  );
}

function MediaForm({ onSubmit }: any) {
  const [data, setData] = useState({ 
    title: '', 
    url: '', 
    category: 'RUANG_GURU',
    description: ''
  });

  const categories = [
    { id: 'RUANG_GURU', label: 'Ruang Guru' },
    { id: 'GAME', label: 'Game' },
    { id: 'YOUTUBE', label: 'Youtube' }
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-2 p-1.5 bg-slate-100 rounded-[1.5rem]">
        {categories.map(cat => (
          <button 
            key={cat.id} 
            type="button"
            onClick={() => setData({...data, category: cat.id})}
            className={`py-2.5 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${data.category === cat.id ? 'bg-white shadow-md text-indigo-600' : 'text-slate-400'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <Input label="Judul Media" value={data.title} onChange={(v:any) => setData({...data, title: v})} />
      <Input label="Tautan (URL)" placeholder="https://..." value={data.url} onChange={(v:any) => setData({...data, url: v})} />
      <div className="space-y-1.5">
        <label className="text-[9px] font-black uppercase text-slate-400 italic tracking-[0.1em] ml-1">Deskripsi</label>
        <textarea 
          placeholder="Jelaskan isi media ini..." 
          value={data.description} 
          onChange={(e) => setData({...data, description: e.target.value})} 
          className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[11px] font-black italic focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600/50 transition-all" 
          rows={3} 
        />
      </div>
      <button 
        onClick={() => onSubmit(data)} 
        disabled={!data.title || !data.url}
        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 mt-2 disabled:opacity-50 active:scale-95 transition-all"
      >
        Simpan Media
      </button>
    </div>
  );
}

export default function MediaPembelajaran() {
  const navigate = useNavigate();
  const { learningMedia, user, addMedia } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [showAdd, setShowAdd] = useState(false);

  const categories = [
    { id: 'ALL', label: 'Semua' },
    { id: 'RUANG_GURU', label: 'Ruang Guru' },
    { id: 'GAME', label: 'Game' },
    { id: 'YOUTUBE', label: 'Youtube' }
  ];

  const filteredMedia = useMemo(() => {
    return learningMedia.filter(m => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = 
        m.title.toLowerCase().includes(s) || 
        m.url.toLowerCase().includes(s) || 
        (m.description || '').toLowerCase().includes(s);
      
      const matchesTab = activeTab === 'ALL' || m.category === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [learningMedia, searchTerm, activeTab]);

  const getIcon = (cat: string | undefined) => {
    if (cat === 'YOUTUBE') return <Youtube size={26} className="text-rose-500" />;
    if (cat === 'GAME') return <Gamepad2 size={26} className="text-emerald-500" />;
    return <BookOpen size={26} className="text-indigo-500" />;
  };

  const getLabel = (cat: string | undefined) => {
    if (cat === 'YOUTUBE') return 'Youtube Content';
    if (cat === 'GAME') return 'Game Pembelajaran';
    return 'Ruang Guru Nasional';
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="bg-primary p-6 pt-10 text-white relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse"></div>
        <div className="flex items-center gap-4 relative z-10 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-white/20 hover:bg-white/30 rounded-2xl backdrop-blur-md transition-all active:scale-95"><ChevronLeft size={20} /></button>
          <div className="flex flex-col">
            <h2 className="text-xl font-black italic tracking-tight uppercase">Media Belajar</h2>
            <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Pusat Sumber Belajar</p>
          </div>
        </div>
        <div className="relative z-10 bg-white shadow-xl rounded-2xl flex items-center px-4 mb-4">
           <Search size={18} className="text-slate-300" />
           <input 
             placeholder="Cari Materi / Link..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full py-4 px-3 text-slate-800 text-xs font-black italic bg-transparent focus:outline-none uppercase" 
           />
        </div>
        
        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide relative z-10">
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase italic transition-all ${activeTab === cat.id ? 'bg-white text-primary shadow-lg' : 'bg-white/20 text-white border border-white/10'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 scrollbar-hide">
        <div className="space-y-4 pb-24">
          {user?.role === 'admin' && (
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdd(true)}
              className="w-full py-4 bg-white border-2 border-dashed border-indigo-100 text-indigo-600 rounded-[2.5rem] flex items-center justify-center gap-3 font-black uppercase italic text-[10px] tracking-widest shadow-sm hover:bg-slate-50 transition-all mb-6"
            >
              <PlusCircle size={20} />
              Tambah Media Belajar
            </motion.button>
          )}

          <AnimatePresence mode="popLayout">
            {filteredMedia.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden"
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shrink-0">
                    {getIcon(item.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest italic leading-none">{getLabel(item.category)}</span>
                    <h4 className="text-[13px] font-black uppercase text-slate-800 truncate leading-tight mt-0.5">{item.title}</h4>
                    {item.description && (
                      <p className="text-[10px] font-medium text-slate-500 mt-1 line-clamp-2 italic leading-tight">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-slate-50/50 flex items-center justify-between border-t border-slate-50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-300" />
                      <span className="text-[8px] font-bold text-slate-400">{item.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <UserIcon size={12} className="text-slate-300" />
                      <span className="text-[8px] font-bold text-slate-400 uppercase">{item.addedBy}</span>
                    </div>
                  </div>
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase italic shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                  >
                    Buka
                    <ExternalLink size={12} />
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredMedia.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-[2.5rem] mx-auto mb-6 flex items-center justify-center text-slate-200">
                <Search size={40} />
              </div>
              <p className="text-slate-400 font-black uppercase text-[11px] italic tracking-widest">
                Media tidak ditemukan
              </p>
              <button 
                onClick={() => setSearchTerm('')}
                className="mt-4 text-indigo-500 text-[10px] font-black uppercase underline decoration-2 underline-offset-4"
              >
                Reset Pencarian
              </button>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <Modal onClose={() => setShowAdd(false)} title="Tambah Media Belajar">
            <MediaForm onSubmit={async (data: any) => {
              await addMedia({
                ...data,
                addedBy: user?.name || 'Admin',
                date: format(new Date(), 'dd MMM yyyy')
              });
              setShowAdd(false);
            }} />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
