import React, { useState, useRef } from 'react';
import { useApp } from '../AppContext';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  GraduationCap, 
  Camera, 
  Save, 
  ArrowLeft,
  Briefcase,
  BookOpen,
  Loader2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, updateUser } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    bio: user?.bio || '',
    address: user?.address || '',
    birthDate: user?.birthDate || '',
    gender: user?.gender || 'Laki-laki',
    education: user?.education || '',
    position: user?.position || '',
    subject: user?.subject || '',
  });

  const [avatar, setAvatar] = useState(user?.avatar || '');

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Quality 0.7 for good balance of size and quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setAvatar(compressed);
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      await updateUser({
        ...user,
        ...formData,
        avatar
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating user:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-primary pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative z-10 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-white font-black uppercase italic tracking-widest text-sm">Profil Saya</h1>
          <div className="w-10" />
        </div>

        {/* Profile Header */}
        <div className="mt-8 flex flex-col items-center">
          <div className="relative">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-32 h-32 rounded-[2.5rem] bg-white p-1 shadow-2xl relative z-10 overflow-hidden"
            >
              <img 
                src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Staff')}&background=E2E8F0&color=475569&bold=true&size=256`} 
                alt="Avatar" 
                className="w-full h-full object-cover rounded-[2.2rem]"
              />
            </motion.div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-primary z-20 hover:scale-110 active:scale-95 transition-all"
            >
              <Camera size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
          <div className="mt-4 text-center">
            <h2 className="text-xl font-black text-white italic uppercase tracking-tight">{user?.name}</h2>
            <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">{user?.employeeId} • {user?.position || 'Staff'}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 -mt-12 relative z-20">
        <motion.form 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-[3rem] p-8 shadow-2xl space-y-6 border border-slate-100"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500">
                  <UserIcon size={16} />
               </div>
               <h3 className="text-[10px] font-black uppercase italic tracking-widest text-slate-400">Data Biodata</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Name */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="Masukkan nama lengkap"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                  />
               </div>

               {/* Email */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="email@sekolah.sch.id"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
               </div>

               {/* Phone */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Nomor Telepon/WA</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="tel" 
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder="0812xxxx"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
               </div>

               {/* Position */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Jabatan</label>
                  <div className="relative">
                    <Briefcase size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="text" 
                      value={formData.position}
                      onChange={e => setFormData({...formData, position: e.target.value})}
                      placeholder="Contoh: Guru Matematika"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
               </div>

               {/* Subject */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Mata Pelajaran</label>
                  <div className="relative">
                    <BookOpen size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="text" 
                      value={formData.subject}
                      onChange={e => setFormData({...formData, subject: e.target.value})}
                      placeholder="Contoh: Matematika, Fisika"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
               </div>

               {/* Education */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Pendidikan Terakhir</label>
                  <div className="relative">
                    <GraduationCap size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="text" 
                      value={formData.education}
                      onChange={e => setFormData({...formData, education: e.target.value})}
                      placeholder="Contoh: S1 Pendidikan Matematika"
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
               </div>

               {/* Date of Birth */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Tanggal Lahir</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      type="date" 
                      value={formData.birthDate}
                      onChange={e => setFormData({...formData, birthDate: e.target.value})}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                  </div>
               </div>

               {/* Gender */}
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Jenis Kelamin</label>
                  <select 
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value as any})}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all appearance-none"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
               </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Alamat Lengkap</label>
               <div className="relative">
                 <MapPin size={16} className="absolute left-5 top-5 text-slate-300" />
                 <textarea 
                   rows={3}
                   value={formData.address}
                   onChange={e => setFormData({...formData, address: e.target.value})}
                   placeholder="Masukkan alamat tinggal saat ini"
                   className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none"
                 />
               </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
               <label className="text-[10px] font-black uppercase text-slate-500 ml-1">Biografi Singkat</label>
               <textarea 
                 rows={3}
                 value={formData.bio}
                 onChange={e => setFormData({...formData, bio: e.target.value})}
                 placeholder="Tuliskan sedikit tentang diri Anda..."
                 className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none"
               />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full py-5 rounded-[2rem] flex items-center justify-center gap-3 text-white transition-all shadow-xl active:scale-95 ${success ? 'bg-green-500' : 'bg-primary hover:bg-indigo-600'}`}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : success ? (
              <Check size={20} />
            ) : (
              <Save size={20} />
            )}
            <span className="font-black uppercase italic tracking-widest text-sm">
              {loading ? 'Menyimpan...' : success ? 'Tersimpan!' : 'Simpan Profil'}
            </span>
          </button>
        </motion.form>
      </div>

      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 px-6 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase italic tracking-widest shadow-2xl z-[100]"
          >
            Profil berhasil diperbarui ✨
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
