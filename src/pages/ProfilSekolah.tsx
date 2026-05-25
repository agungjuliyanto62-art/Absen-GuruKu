import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, School, MapPin, Phone, Globe, Mail, Info, Award, Users, Star } from 'lucide-react';
import { useApp } from '../AppContext';
import { motion } from 'motion/react';

export default function ProfilSekolah() {
  const navigate = useNavigate();
  const { schoolProfile, users } = useApp();
  const teacherCount = users.filter(u => u.role === 'teacher').length;

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Dynamic Header with Banner Photo */}
      <div className="relative h-64 bg-slate-900 shrink-0 overflow-hidden">
        {schoolProfile.bannerPhoto ? (
          <img src={schoolProfile.bannerPhoto} className="w-full h-full object-cover opacity-60" alt="School Banner" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-slate-900 opacity-80" />
        )}
        
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-50 to-transparent" />
        
        <div className="absolute top-10 left-6 z-20">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 bg-white/20 hover:bg-white/40 rounded-2xl backdrop-blur-md transition-all flex items-center justify-center text-white"
          >
            <ChevronLeft size={22} />
          </button>
        </div>

        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-30 w-full px-6">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-100 flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-white rounded-3xl shadow-lg border border-slate-50 p-3 mb-4 -mt-16 flex items-center justify-center">
               {schoolProfile.logo ? <img src={schoolProfile.logo} className="w-full h-full object-contain" alt="Logo" /> : <School size={32} className="text-indigo-600" />}
            </div>
            <h1 className="text-lg font-black uppercase italic tracking-tight text-slate-800 leading-tight">
              {schoolProfile.name}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mt-2 italic">
              {schoolProfile.motto || 'Unggul Dalam Prestasi, Santun Dalam Budi Pekerti'}
            </p>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-2 pb-24 scrollbar-hide">
        <div className="space-y-6 mt-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Guru & Staff" value={teacherCount} icon={<Users size={18} />} color="bg-indigo-600" />
            <StatCard label="Akreditasi" value={schoolProfile.accreditation || 'A'} icon={<Award size={18} />} color="bg-emerald-600" />
          </div>

          {/* Headmaster's Greeting */}
          <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600"><Info size={16} /></div>
              <h3 className="text-[11px] font-black uppercase italic tracking-widest text-slate-800">Sambutan Kepala Sekolah</h3>
            </div>
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0">
                  {schoolProfile.headmasterPhoto ? (
                    <img src={schoolProfile.headmasterPhoto} className="w-full h-full object-cover" alt="Kepala Sekolah" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 font-black tracking-tighter">FOTO</div>
                  )}
                </div>
                <div>
                  <h4 className="text-[12px] font-black uppercase text-slate-800 leading-tight">{schoolProfile.headmaster}</h4>
                  <p className="text-[9px] font-black text-indigo-500 uppercase italic mt-0.5">Kepala Sekolah</p>
                </div>
              </div>
              <p className="text-[11px] font-medium text-slate-500 italic leading-relaxed">
                "{schoolProfile.history || 'Selamat datang di portal informasi resmi sekolah kami. Kami berkomitmen untuk terus berinovasi dan memberikan pelayanan pendidikan terbaik bagi seluruh putra-putri bangsa.'}"
              </p>
            </div>
          </section>

          {/* Vision & Mission */}
          <section className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-white/10 transition-colors" />
            <div className="relative z-10 space-y-8">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2 italic">Visi Kami</h4>
                <p className="text-lg font-black italic tracking-tight leading-snug">"{schoolProfile.vision}"</p>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 italic">Misi Sekolah</h4>
                <div className="space-y-3">
                  {schoolProfile.mission.map((m, i) => (
                    <div key={i} className="flex gap-4 group/item">
                       <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-black italic shrink-0 group-hover/item:bg-indigo-500 transition-colors">{i+1}</span>
                       <p className="text-[11px] font-medium leading-relaxed opacity-80 group-hover/item:opacity-100 transition-opacity">{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Facilities Section */}
          {schoolProfile.facilities && schoolProfile.facilities.length > 0 && (
            <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Star size={16} /></div>
                  <h3 className="text-[11px] font-black uppercase italic tracking-widest text-slate-800">Fasilitas Unggulan</h3>
               </div>
               <div className="flex flex-wrap gap-2">
                 {schoolProfile.facilities.map((fac, i) => (
                   <span key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black uppercase italic text-slate-500 hover:border-emerald-200 hover:text-emerald-600 transition-all cursor-default">
                     {fac}
                   </span>
                 ))}
               </div>
            </section>
          )}

          {/* Contact Section */}
          <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600"><Globe size={16} /></div>
              <h3 className="text-[11px] font-black uppercase italic tracking-widest text-slate-800">Hubungi Kami</h3>
            </div>
            <div className="space-y-5">
              <ContactItem icon={<MapPin size={16} />} label="Alamat Kampus" value={schoolProfile.address} />
              <div className="grid grid-cols-1 gap-5">
                <ContactItem icon={<Phone size={16} />} label="Nomor Telepon" value={schoolProfile.phone} />
                <ContactItem icon={<Mail size={16} />} label="Email Resmi" value={schoolProfile.email} />
                <ContactItem icon={<Globe size={16} />} label="Website" value={schoolProfile.website} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ContactItem({ icon, label, value }: any) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-indigo-500 shrink-0 border border-slate-100">{icon}</div>
      <div className="min-w-0">
        <p className="text-[8px] uppercase font-black text-slate-300 tracking-widest mb-0.5">{label}</p>
        <p className="text-[10px] font-black text-slate-800 italic uppercase break-words leading-tight">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className={`${color} p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group`}>
       <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full -mr-4 -mt-4 group-hover:scale-150 transition-transform duration-700" />
       <div className="bg-white/20 w-10 h-10 rounded-2xl flex items-center justify-center mb-4 relative z-10">{icon}</div>
       <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-70 mb-1 relative z-10">{label}</p>
       <h3 className="text-2xl font-black italic relative z-10 tracking-tight">{value}</h3>
    </div>
  );
}
