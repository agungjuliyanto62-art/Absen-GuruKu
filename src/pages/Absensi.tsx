import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useApp } from '../AppContext';
import { 
  Camera, 
  MapPin, 
  CheckCircle2, 
  RefreshCcw, 
  ChevronLeft,
  RotateCw,
  Target,
  Clock,
  Briefcase,
  Utensils,
  ChevronRight,
  XCircle,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icons
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Refined default icon to look like a standard pin
const defaultIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="flex flex-col items-center">
           <div class="w-10 h-10 bg-[#FF5A5F] rounded-full flex items-center justify-center border-4 border-white shadow-xl">
             <div class="w-3 h-3 bg-white rounded-full"></div>
           </div>
           <div class="w-1 h-3 bg-[#FF5A5F] -mt-1 rounded-full shadow-lg"></div>
         </div>`,
  iconSize: [40, 50],
  iconAnchor: [20, 50],
});

// Component to handle map centering and size refresh when location changes
function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
    // Force invalidateSize to handle layout shifts
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timer);
  }, [center, map]);
  return null;
}

export default function Absensi() {
  const { user, clockIn, clockOut, attendanceData, settings } = useApp();
  const [step, setStep] = useState<'view' | 'face' | 'success'>('view');
  const [mapReady, setMapReady] = useState(false);
  
  // Office Location from settings
  const officeLocation: [number, number] = [settings.center.lat, settings.center.lng];
  const toleranceMeters = settings.radius;

  const [location, setLocation] = useState<{ lat: number, lng: number, address: string, accuracy: number } | null>(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const navigate = useNavigate();
  const [isRefreshingLocation, setIsRefreshingLocation] = useState(false);

  const refreshGPS = () => {
    if (!navigator.geolocation) return;
    setIsRefreshingLocation(true);
    
    let bestPos: GeolocationPosition | null = null;
    
    // Open a temporary real-time watch session for 3.5 seconds
    // to capture multiple consecutive samples from the hardware and lock onto the absolute most accurate satellite reference
    const tempWatchId = navigator.geolocation.watchPosition(
      (pos) => {
        const currentAcc = pos.coords.accuracy;
        if (!bestPos || currentAcc < bestPos.coords.accuracy) {
          bestPos = pos;
        }

        const latitude = bestPos.coords.latitude;
        const longitude = bestPos.coords.longitude;
        const accuracy = bestPos.coords.accuracy;

        setLocation({
          lat: latitude,
          lng: longitude,
          address: 'Lokasi Terdeteksi',
          accuracy: accuracy
        });
        
        // Accurate Haversine calculation
        const R = 6371e3; // metres
        const φ1 = latitude * Math.PI/180;
        const φ2 = officeLocation[0] * Math.PI/180;
        const Δφ = (officeLocation[0]-latitude) * Math.PI/180;
        const Δλ = (officeLocation[1]-longitude) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        const dist = R * c;
        setDistance(dist);
        
        // Auto-Adjusted logic: extend standard radius by the GPS tolerance index (up to 120m maximum offset)
        // This is extremely helpful indoors or where GPS satellites drift, preventing teachers from getting false lockout errors
        const dynamicTolerance = toleranceMeters + Math.min(accuracy, 120);
        setIsWithinRange(dist <= dynamicTolerance);
      },
      (err) => {
        console.error("GPS scan error, trying single request:", err);
        // Fallback to classic fast request if watch is restricted or times out
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude, accuracy } = pos.coords;
            setLocation({
              lat: latitude,
              lng: longitude,
              address: 'Lokasi Terdeteksi',
              accuracy: accuracy
            });
            const R = 6371e3;
            const φ1 = latitude * Math.PI/180;
            const φ2 = officeLocation[0] * Math.PI/180;
            const Δφ = (officeLocation[0]-pos.coords.latitude) * Math.PI/180;
            const Δλ = (officeLocation[1]-pos.coords.longitude) * Math.PI/180;
            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
            const dist = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
            setDistance(dist);
            setIsWithinRange(dist <= (toleranceMeters + Math.min(accuracy, 120)));
          },
          (innerErr) => {
            console.error("Fallback GPS error:", innerErr);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );

    // Grace period to gather the best GPS signals automatically
    setTimeout(() => {
      navigator.geolocation.clearWatch(tempWatchId);
      setIsRefreshingLocation(false);
    }, 3200);
  };

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const todayRecord = attendanceData.find(r => r.date === todayStr && r.userId === user?.id);
  const isClockedIn = !!todayRecord?.clockIn;
  const isClockedOut = !!todayRecord?.clockOut;
  const isWeekend = useMemo(() => new Date().getDay() === 0 || new Date().getDay() === 6, []);

  useEffect(() => {
    // Delay map rendering slightly for layout stability
    const timer = setTimeout(() => setMapReady(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      let bestPos: GeolocationPosition | null = null;
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const currentAcc = pos.coords.accuracy;
          
          // If we already successfully locked onto a high precision coordinate, 
          // filter out raw coordinate drift if a subsequent packet is highly inaccurate / cell-tower jump
          if (!bestPos || currentAcc < bestPos.coords.accuracy) {
            bestPos = pos;
          }
          
          // Use the best received coordinate so far if the new one has more than 2.5x worse accuracy, 
          // keeping the position elegant and steady.
          const activePos = (currentAcc > bestPos.coords.accuracy * 2.5 && bestPos) ? bestPos : pos;
          const { latitude, longitude, accuracy } = activePos.coords;

          setLocation({
            lat: latitude,
            lng: longitude,
            address: 'Lokasi Terdeteksi',
            accuracy: accuracy
          });
          
          // Haversine formula for more accurate distance
          const R = 6371e3; // metres
          const φ1 = latitude * Math.PI/180;
          const φ2 = officeLocation[0] * Math.PI/180;
          const Δφ = (officeLocation[0]-latitude) * Math.PI/180;
          const Δλ = (officeLocation[1]-longitude) * Math.PI/180;

          const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                    Math.cos(φ1) * Math.cos(φ2) *
                    Math.sin(Δλ/2) * Math.sin(Δλ/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

          const dist = R * c;
          setDistance(dist);
          
          // Compensate with dynamic tolerance based on GPS hardware inaccuracy (max 120m adjustment)
          const dynamicTolerance = toleranceMeters + Math.min(accuracy, 120);
          setIsWithinRange(dist <= dynamicTolerance);
        },
        () => {
          // Keep default if permission denied
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [officeLocation, toleranceMeters]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
    }
  };

  const handleAction = () => {
    if (isClockedOut) return;
    setStep('face');
    setTimeout(startCamera, 100);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    // Detection Logic
    const isMocked = (location as any)?.isMocked || false;
    const accuracy = location?.accuracy || 0;
    
    // Heuristic: If accuracy is too high (e.g., < 0.1m) it's likely fake in a browser
    // Or if it's suspicious
    let violationType: 'fake_gps' | 'low_accuracy' | 'outside_radius' | undefined = undefined;
    if (isMocked) violationType = 'fake_gps';
    else if (accuracy < 1 && accuracy > 0) violationType = 'fake_gps'; // Suspiciously high
    else if (!isWithinRange) violationType = 'outside_radius';

    const canvas = document.createElement('canvas');
    
    // Scale down image to max 640px to compress the size for Firebase
    let width = video.videoWidth;
    let height = video.videoHeight;
    const max_dimension = 640;
    if (width > max_dimension || height > max_dimension) {
      if (width > height) {
        height = Math.round((height * max_dimension) / width);
        width = max_dimension;
      } else {
        width = Math.round((width * max_dimension) / height);
        height = max_dimension;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame (mirrored to match preview)
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    // Add Watermark
    const fontSize = Math.max(11, Math.floor(width / 38));
    const padding = Math.floor(width / 45);
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    
    const name = user?.name || 'Guru';
    const time = format(new Date(), 'HH:mm:ss');
    const date = format(new Date(), 'dd MMMM yyyy', { locale: id });
    const coords = location 
      ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` 
      : `${officeLocation[0].toFixed(6)}, ${officeLocation[1].toFixed(6)}`;
    const locName = settings.locationName || 'Lokasi Sekolah';

    const lines = [
      name.toUpperCase(),
      `${date} • ${time}`,
      `📍 ${locName}`,
      `🌐 ${coords}${violationType === 'fake_gps' ? ' [FAKE DETECTED]' : ''}`
    ];

    // Calculate background box
    let maxTextWidth = 0;
    lines.forEach(line => {
      const metric = ctx.measureText(line);
      if (metric.width > maxTextWidth) maxTextWidth = metric.width;
    });

    const boxPadding = padding;
    const boxWidth = maxTextWidth + (boxPadding * 2);
    const boxHeight = (lines.length * (fontSize + 6)) + (boxPadding * 2);

    // Position: Bottom Left with healthy margin to avoid getting cut
    const xPos = 15; 
    const yPos = height - boxHeight - 15;

    // Draw background
    ctx.fillStyle = violationType === 'fake_gps' ? 'rgba(225, 29, 72, 0.85)' : 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(xPos, yPos, boxWidth, boxHeight);

    // Draw text
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'top';
    lines.forEach((line, index) => {
      ctx.fillText(
        line, 
        xPos + boxPadding, 
        yPos + boxPadding + (index * (fontSize + 6))
      );
    });

    // Compress to JPEG with 0.6 quality (extremely lightweight!)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
    setPhoto(dataUrl);
    
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setStep('success');
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });

      const securityData = {
        isMocked,
        accuracy,
        violationType
      };

      const locationStr = location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : '0,0';

      if (!isClockedIn) {
        clockIn(dataUrl, locationStr, securityData);
      } else {
        clockOut(dataUrl, locationStr, securityData);
      }
      
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }, 2000);
  };

  return (
    <div className="flex-1 relative flex flex-col bg-white overflow-hidden w-full">
      {/* Map Layer */}
      <div className="absolute inset-0 z-0 bg-slate-100">
        {mapReady && (
          <MapContainer 
            center={location ? [location.lat, location.lng] : officeLocation} 
            zoom={16} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {location && (
              <>
                <Marker position={[location.lat, location.lng]} icon={defaultIcon} />
                <MapController center={[location.lat, location.lng]} />
              </>
            )}
            <Circle 
              center={officeLocation}
              radius={toleranceMeters}
              pathOptions={{ fillColor: '#1A73E8', fillOpacity: 0.1, color: '#1A73E8', weight: 1, dashArray: '5, 10' }}
            />
          </MapContainer>
        )}
      </div>

      {/* Header Controls */}
      <div className="absolute top-8 left-0 right-0 z-[1000] px-4 pointer-events-none">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <button 
            onClick={() => navigate('/')}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-700 active:scale-90 transition-transform pointer-events-auto"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1 px-4 flex justify-center">
             <div className="bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-lg border border-white/20 pointer-events-auto">
                <p className="text-[12px] font-black text-slate-800 tracking-tight whitespace-nowrap">
                  {settings.locationName}
                </p>
             </div>
          </div>
          <button 
            onClick={refreshGPS}
            disabled={isRefreshingLocation}
            className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-700 active:scale-95 transition-transform pointer-events-auto disabled:opacity-80"
          >
            <RotateCw size={20} className={isRefreshingLocation ? "animate-spin text-primary" : "transition-transform"} />
          </button>
        </div>
      </div>

      {/* Interaction UI */}
      <div className="absolute inset-x-0 bottom-0 z-[1001] p-4 pointer-events-none pb-8 sm:pb-12">
        <div className="max-w-md mx-auto w-full space-y-4">
          <AnimatePresence mode="wait">
            {step === 'view' && (
              <motion.div
                key="view"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="pointer-events-auto flex flex-col gap-4"
              >
                {/* Warning Banner if outside radius */}
                {!isWithinRange && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-rose-500 text-white p-4 rounded-[1.5rem] shadow-xl border-4 border-white/20 flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                       <XCircle size={28} className="text-white" />
                    </div>
                    <div>
                       <p className="text-[11px] font-black uppercase tracking-widest leading-none mb-1 opacity-70">Peringatan</p>
                       <p className="text-xs font-black italic uppercase italic">Anda Berada Di luar Radius ({Math.round(distance || 0)}m)</p>
                    </div>
                  </motion.div>
                )}

                {/* Location & Accuracy Card */}
                <div className="bg-white rounded-[1.75rem] p-5 shadow-xl divide-y divide-gray-50">
                  <div className="flex items-center gap-4 pb-4">
                     <div className={`w-10 h-10 flex items-center justify-center ${isWithinRange ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isWithinRange ? <CheckCircle2 size={24} strokeWidth={2} /> : <XCircle size={24} strokeWidth={2} />}
                     </div>
                     <div>
                        <p className="text-[13px] font-bold text-slate-400 leading-none mb-1">Status Lokasi</p>
                        <p className={`text-[14px] font-black tracking-tight ${isWithinRange ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {isWithinRange 
                            ? (location && location.accuracy > 30 
                              ? 'Valid (Radius Disesuaikan)' 
                              : 'Lokasi Valid (Dalam Radius)') 
                            : `Terlalu Jauh (${Math.round(distance || 0)}m)`}
                        </p>
                        {isWithinRange && location && location.accuracy > 30 && (
                          <p className="text-[10px] text-emerald-500 font-bold mt-0.5 leading-tight italic">
                            Sinyal lemah, kompensasi otomatis aktif agar bisa absen
                          </p>
                        )}
                     </div>
                  </div>
                  <div className="flex items-center gap-4 pt-4">
                     <div className="w-10 h-10 flex items-center justify-center text-slate-800">
                        <Target size={24} strokeWidth={2} className="text-indigo-600" />
                     </div>
                     <div className="flex-1">
                        <p className="text-[13px] font-bold text-slate-400 leading-none mb-1">Akurasi GPS</p>
                        <div className="flex items-center justify-between">
                          <p className="text-[14px] font-black text-slate-800 tracking-tight">
                            {location?.accuracy ? `${Math.round(location.accuracy)} Meter` : 'Mendeteksi...'}
                          </p>
                          <span className={`text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full ${
                            !location?.accuracy 
                              ? 'bg-slate-100 text-slate-500' 
                              : location.accuracy <= 15 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : location.accuracy <= 50 
                                  ? 'bg-amber-100 text-amber-700' 
                                  : 'bg-indigo-100 text-indigo-700 animate-pulse'
                          }`}>
                            {!location?.accuracy 
                              ? 'Mencari...' 
                              : location.accuracy <= 15 
                                ? 'Sangat Presisi' 
                                : location.accuracy <= 50 
                                  ? 'Presisi Sedang' 
                                  : 'Optimasi Otomatis'}
                          </span>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Main Actions Card */}
                <div className="bg-white rounded-[1.75rem] p-5 shadow-xl divide-y divide-gray-50 text-slate-800">
                   {/* Holiday / Regular Info */}
                   <div className="flex justify-between items-start pb-4">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 flex items-center justify-center">
                            <Clock size={24} strokeWidth={2} />
                         </div>
                         <div>
                            <p className="text-[13px] font-bold text-slate-400 leading-none mb-1">{isWeekend ? 'libur' : 'Kerja'}</p>
                            <p className="text-[14px] font-black">-</p>
                         </div>
                      </div>
                      <p className="text-[13px] font-black text-slate-700 mt-1 whitespace-nowrap">
                         {format(new Date(), "eeee, dd MMM yyyy", { locale: id })}
                      </p>
                   </div>

                   {/* Clock In/Out */}
                   <div className="py-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 flex items-center justify-center text-blue-500">
                            <Briefcase size={24} strokeWidth={2} />
                         </div>
                         <div>
                            <p className="text-[13px] font-bold text-slate-400 leading-none mb-1">Jam Absen</p>
                            <p className="text-[11px] font-black italic text-slate-400">
                               {settings.workHours.entryStart} - {settings.workHours.exitEnd}
                            </p>
                         </div>
                      </div>
                      <motion.button
                         whileTap={{ scale: 0.96 }}
                         onClick={handleAction}
                         disabled={isClockedOut || !isWithinRange}
                         className={`h-11 px-5 ${isClockedOut || !isWithinRange ? 'bg-slate-300 opacity-60' : 'bg-slate-900'} text-white rounded-2xl font-black text-[13px] flex items-center gap-3 transition-all`}
                      >
                         <span>
                           {isClockedOut ? 'Absensi Selesai' : (isClockedIn ? 'Absensi Pulang' : 'Absensi Masuk')}
                         </span>
                         <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                           <ChevronRight size={16} strokeWidth={3} className="text-white" />
                         </div>
                      </motion.button>
                   </div>

                    {/* Break Info renamed to Absen Pulang */}
                    <div className="pt-4 flex justify-between items-center">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 flex items-center justify-center text-rose-500">
                             <LogOut size={24} strokeWidth={2} />
                          </div>
                          <div>
                             <p className="text-[13px] font-bold text-slate-400 leading-none mb-1">Absen Pulang</p>
                             <p className="text-[14px] font-black">-</p>
                          </div>
                       </div>
                      <motion.button
                         disabled
                         className="h-11 px-5 bg-[#9BA5B1] text-white rounded-2xl font-black text-[13px] flex items-center gap-3"
                      >
                         <span>Absen Pulang</span>
                         <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                           <ChevronRight size={16} strokeWidth={3} className="text-white" />
                         </div>
                      </motion.button>
                   </div>
                </div>
              </motion.div>
            )}

            {step === 'face' && (
              <motion.div 
                key="face"
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="bg-white rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center pointer-events-auto"
              >
                <h3 className="text-xl font-black text-slate-800 mb-2">Verifikasi Wajah</h3>
                <p className="text-slate-400 text-sm mb-10 text-center">Pastikan wajah Anda berada di dalam lingkaran.</p>
                
                <div className="relative w-64 h-64 rounded-full overflow-hidden border-8 border-slate-50 shadow-inner bg-black mb-10">
                   {!photo ? (
                     <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                   ) : (
                     <img src={photo} alt="Captured" className="w-full h-full object-cover" />
                   )}
                   <div className="absolute inset-0 border-[30px] border-black/40 rounded-full pointer-events-none"></div>
                   {verifying && (
                     <div className="absolute inset-0 bg-blue-600/40 backdrop-blur-md flex flex-col items-center justify-center text-white">
                        <RefreshCcw size={48} className="animate-spin mb-4" />
                        <p className="font-bold tracking-widest uppercase text-[10px]">Memproses...</p>
                     </div>
                   )}
                </div>

                {!photo && !verifying && (
                  <button
                    onClick={capturePhoto}
                    className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl ring-8 ring-blue-50 active:scale-90 transition-all"
                  >
                    <Camera size={32} />
                  </button>
                )}
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[3rem] p-10 shadow-2xl flex flex-col items-center justify-center text-center pointer-events-auto"
              >
                 <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-8">
                    <CheckCircle2 size={48} strokeWidth={2.5} />
                 </div>
                 
                 <h3 className="text-2xl font-black text-slate-800 mb-3">Berhasil!</h3>
                 <p className="text-slate-400 text-sm mb-10 px-6 leading-relaxed">
                   Data absensi Anda telah tercatat pada {format(new Date(), 'HH:mm')} hari ini.
                 </p>

                 <button
                  onClick={() => navigate('/')}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-all text-[15px]"
                >
                  Tutup
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}



