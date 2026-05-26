import React, { useState, useRef } from 'react';
import { useApp } from '../AppContext';
import { FileText, Calendar, Upload, ChevronLeft, Send, Camera, Image as ImageIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function Izin() {
  const navigate = useNavigate();
  const { addLeaveRequest, user, settings } = useApp();
  const [formData, setFormData] = useState({
    type: 'izin',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [attachment, setAttachment] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachment(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getWhatsAppInfo = () => {
    const targetPhone = settings?.whatsappNumber || "6285669833136";
    const rawTemplate = settings?.whatsappTemplate || "Halo Atasan, saya [Nama] mengajukan izin [Jenis] dari tanggal [TanggalMulai] s/d [TanggalSelesai] dengan alasan: [Alasan]. Terima kasih.";
    
    const formattedType = (() => {
      switch (formData.type) {
        case 'sakit': return 'Sakit';
        case 'izin': return 'Izin';
        case 'cuti': return 'Cuti';
        case 'terlambat': return 'Terlambat';
        case 'pulang_cepat': return 'Pulang Cepat';
        default: return formData.type.charAt(0).toUpperCase() + formData.type.slice(1);
      }
    })();

    const formatDateIndo = (dateStr: string) => {
      if (!dateStr) return '';
      try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
          const day = parseInt(parts[2], 10);
          const monthIndex = parseInt(parts[1], 10) - 1;
          const year = parts[0];
          return `${day} ${months[monthIndex]} ${year}`;
        }
        return dateStr;
      } catch (e) {
        return dateStr;
      }
    };

    const text = rawTemplate
      .replace(/\[Nama\]/g, user?.name || '')
      .replace(/\[Jenis\]/g, formattedType)
      .replace(/\[TanggalMulai\]/g, formatDateIndo(formData.startDate))
      .replace(/\[TanggalSelesai\]/g, formatDateIndo(formData.endDate))
      .replace(/\[Alasan\]/g, formData.reason || '');

    const link = `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`;
    return { targetPhone, text, link };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    addLeaveRequest({
      userId: user.id,
      type: formData.type as any,
      startDate: formData.startDate,
      endDate: formData.endDate,
      reason: formData.reason,
      attachment: attachment || undefined,
    });
    
    setSubmitted(true);
    
    // Construct WhatsApp Message dynamically
    const { link } = getWhatsAppInfo();
    
    setTimeout(() => {
      window.open(link, '_blank');
    }, 2000);
  };

  if (submitted) {
    const { link } = getWhatsAppInfo();

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white h-full">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-6 shadow-lg shadow-emerald-50"
        >
          <Send size={48} />
        </motion.div>
        <h2 className="text-2xl font-black text-slate-800 mb-2 italic text-center uppercase tracking-tight">Permohonan Terkirim!</h2>
        <p className="text-slate-500 text-center font-medium mb-8 text-sm">Data telah tersimpan di sistem. Tunggu sebentar, Anda akan diarahkan ke WhatsApp...</p>
        
        <div className="w-full space-y-3">
          <button 
            onClick={() => window.open(link, '_blank')}
            className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-emerald-100"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.438 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            Buka WhatsApp Sekarang
          </button>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 bg-primary text-white flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 bg-white/20 rounded-xl">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold">Permohonan Izin / Cuti</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6 pb-24 overflow-y-auto">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">Jenis Permohonan</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {['Izin', 'Cuti', 'Sakit', 'Terlambat', 'Pulang Cepat'].map((item) => {
              const typeValue = item.toLowerCase().replace(' ', '_');
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: typeValue })}
                  className={`py-3 rounded-2xl font-bold text-[10px] uppercase tracking-wider transition-all ${
                    formData.type === typeValue
                    ? 'bg-primary text-white shadow-lg shadow-blue-100' 
                    : 'bg-gray-50 text-gray-500 border border-gray-100'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Dari Tanggal</label>
              <div className="relative">
                <input 
                  type="date" 
                  required
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold"
                />
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase">Sampai Tanggal</label>
              <div className="relative">
                <input 
                   type="date"
                   required
                   value={formData.endDate}
                   onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                   className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold"
                />
              </div>
           </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase">Alasan / Keperluan</label>
          <textarea 
            rows={4}
            required
            value={formData.reason}
            onChange={e => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Tuliskan alasan permohonan Anda..."
            className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
          />
        </div>

        <div className="space-y-3">
           <label className="text-xs font-bold text-gray-400 uppercase">Lampiran (Wajib)</label>
           
           {!attachment ? (
             <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <Camera size={28} />
                  <span className="text-xs font-bold">Ambil Foto</span>
                </button>
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 p-6 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  <ImageIcon size={28} />
                  <span className="text-xs font-bold">Dari Galeri</span>
                </button>
             </div>
           ) : (
             <div className="relative rounded-2xl overflow-hidden border-2 border-primary/20 group">
                <img src={attachment} alt="Attachment Preview" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                   <button 
                     type="button"
                     onClick={() => setAttachment(null)}
                     className="bg-white text-red-500 p-2 rounded-full shadow-lg"
                   >
                     <X size={20} />
                   </button>
                </div>
                <p className="absolute bottom-2 left-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-primary">Pratinjau Lampiran</p>
             </div>
           )}

           {/* Hidden Inputs */}
           <input 
             type="file" 
             ref={cameraInputRef} 
             accept="image/*" 
             capture="environment" 
             className="hidden" 
             onChange={handleFileChange}
           />
           <input 
             type="file" 
             ref={galleryInputRef} 
             accept="image/*" 
             className="hidden" 
             onChange={handleFileChange}
           />
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="w-full bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
        >
          <Send size={20} />
          Kirim Permohonan
        </motion.button>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full py-4 text-slate-400 font-bold text-xs uppercase tracking-widest"
        >
          Batal & Kembali
        </button>
      </form>
    </div>
  );
}
