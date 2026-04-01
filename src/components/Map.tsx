import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapPin, Building2, AlertTriangle, ShieldCheck, Home, ShieldAlert } from 'lucide-react';
import { MapPoint } from '../types';

// Rough Jambi Boundary
const JAMBI_BOUNDARY: [number, number][] = [
  [-0.75, 102.2],
  [-0.85, 103.5],
  [-1.0, 104.4],
  [-1.5, 104.6],
  [-2.3, 104.3],
  [-2.7, 103.5],
  [-2.8, 102.2],
  [-2.5, 101.2],
  [-1.8, 101.1],
  [-1.2, 101.3],
];

const createCustomIcon = (kategori: string, risk: string) => {
  let color = '#002366'; // Default Immi Blue
  let Icon = MapPin;

  if (kategori === 'Perusahaan') {
    color = risk === 'High' ? '#DC2626' : risk === 'Medium' ? '#D4AF37' : '#002366';
    Icon = Building2;
  } else if (kategori === 'Titik Rentan') {
    color = '#DC2626';
    Icon = ShieldAlert;
  } else if (kategori === 'Desa Binaan') {
    color = '#D4AF37';
    Icon = Home;
  }

  const iconMarkup = renderToStaticMarkup(
    <div className="relative flex items-center justify-center">
      <div 
        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg border-2 border-white transition-transform hover:scale-110"
        style={{ backgroundColor: color }}
      >
        <Icon size={20} />
      </div>
      <div 
        className="absolute -bottom-1 w-2 h-2 rotate-45"
        style={{ backgroundColor: color }}
      ></div>
    </div>
  );

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-map-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

function Legend() {
  return (
    <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-slate-200 shadow-xl max-w-[240px]">
      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Legenda Wilayah</h4>
      <div className="space-y-3">
        <LegendItem color="bg-immi-blue" label="Perusahaan (Low Risk)" icon={<Building2 size={12} />} />
        <LegendItem color="bg-immi-gold" label="Perusahaan (Med Risk)" icon={<Building2 size={12} />} />
        <LegendItem color="bg-red-600" label="Perusahaan (High Risk)" icon={<Building2 size={12} />} />
        <LegendItem color="bg-red-600" label="Titik Rentan OA" icon={<ShieldAlert size={12} />} />
        <LegendItem color="bg-immi-gold" label="Desa Binaan" icon={<Home size={12} />} />
        <div className="pt-2 mt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-immi-blue bg-immi-blue/10 rounded"></div>
            <span className="text-[10px] font-bold text-slate-600">Batas Wilayah Kerja</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, icon }: { color: string, label: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-6 h-6 ${color} rounded-lg flex items-center justify-center text-white shadow-sm`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">{label}</span>
    </div>
  );
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  map.setView(center);
  return null;
}

export default function MapView({ points, center }: { points: MapPoint[], center: [number, number] }) {
  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={center} 
        zoom={9} 
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={center} />
        
        {/* Jambi Boundary */}
        <Polygon 
          positions={JAMBI_BOUNDARY}
          pathOptions={{
            color: '#002366',
            weight: 2,
            fillColor: '#002366',
            fillOpacity: 0.05,
            dashArray: '5, 10'
          }}
        />

        {points.map((point) => (
          <Marker 
            key={point.id} 
            position={[point.latitude, point.longitude]}
            icon={createCustomIcon(point.kategori, point.tingkat_risiko)}
          >
            <Popup className="immi-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    point.kategori === 'Perusahaan' ? 'bg-blue-100 text-immi-blue' :
                    point.kategori === 'Titik Rentan' ? 'bg-red-100 text-red-600' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {point.kategori}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    point.tingkat_risiko === 'High' ? 'bg-red-600 text-white' :
                    point.tingkat_risiko === 'Medium' ? 'bg-immi-gold text-white' :
                    'bg-immi-blue text-white'
                  }`}>
                    {point.tingkat_risiko}
                  </span>
                </div>
                
                <h3 className="text-sm font-bold text-slate-800 mb-1">{point.nama_lokasi}</h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">{point.deskripsi}</p>
                
                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  {point.kategori === 'Perusahaan' && (
                    <>
                      <DetailRow label="Jumlah OA" value={`${point.jumlah_orang_asing || 0} Orang`} />
                      <DetailRow label="Pelanggaran" value={point.riwayat_pelanggaran || 'Nihil'} />
                    </>
                  )}
                  {point.kategori === 'Desa Binaan' && (
                    <>
                      <DetailRow label="Status" value={point.status_binaan || '-'} />
                      <DetailRow label="TPPO" value={point.kerentanan_tppo || '-'} />
                    </>
                  )}
                  <DetailRow label="Koordinat" value={`${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`} />
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
        <Legend />
      </MapContainer>
    </div>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-[10px] font-bold text-slate-700">{value}</span>
    </div>
  );
}
