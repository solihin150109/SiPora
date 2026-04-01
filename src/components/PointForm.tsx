import React, { useState } from 'react';
import { MapPin, AlertCircle, Building2, Home, ShieldAlert, Info, PlusCircle, Globe, History } from 'lucide-react';

interface PointFormProps {
  onSuccess: () => void;
}

type FormType = 'Perusahaan' | 'Titik Rentan' | 'Desa Binaan';

export default function PointForm({ onSuccess }: PointFormProps) {
  const [activeTab, setActiveTab] = useState<FormType>('Perusahaan');
  const [formData, setFormData] = useState({
    nama_lokasi: '',
    tingkat_risiko: 'Low',
    keterangan: '',
    latitude: '',
    longitude: '',
    // Perusahaan
    jumlah_orang_asing: '0',
    riwayat_pelanggaran: '',
    // Desa Binaan
    kerentanan_tppo: 'Low',
    kerentanan_tppm: 'Low',
    status_binaan: 'Rencana'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          kategori: activeTab,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          jumlah_orang_asing: parseInt(formData.jumlah_orang_asing)
        })
      });

      if (!res.ok) throw new Error('Gagal menyimpan data');
      
      setFormData({
        nama_lokasi: '',
        tingkat_risiko: 'Low',
        keterangan: '',
        latitude: '',
        longitude: '',
        jumlah_orang_asing: '0',
        riwayat_pelanggaran: '',
        kerentanan_tppo: 'Low',
        kerentanan_tppm: 'Low',
        status_binaan: 'Rencana'
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overflow-hidden">
      {/* Tab Header */}
      <div className="flex bg-slate-50 p-1 rounded-2xl mb-8">
        <TabButton 
          active={activeTab === 'Perusahaan'} 
          onClick={() => setActiveTab('Perusahaan')}
          icon={<Building2 size={18} />}
          label="Perusahaan"
        />
        <TabButton 
          active={activeTab === 'Titik Rentan'} 
          onClick={() => setActiveTab('Titik Rentan')}
          icon={<ShieldAlert size={18} />}
          label="Titik Rentan"
        />
        <TabButton 
          active={activeTab === 'Desa Binaan'} 
          onClick={() => setActiveTab('Desa Binaan')}
          icon={<Home size={18} />}
          label="Desa Binaan"
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-3 border border-red-100">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2">
            <label className="immi-label">Nama Lokasi / Instansi / Desa</label>
            <div className="relative">
              <Info className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                required
                className="immi-input pl-12"
                value={formData.nama_lokasi}
                onChange={(e) => setFormData({ ...formData, nama_lokasi: e.target.value })}
                placeholder="Contoh: PT. Jambi Maju Jaya"
              />
            </div>
          </div>
        </div>

        {activeTab === 'Perusahaan' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-2">
              <label className="immi-label">Jumlah Orang Asing (TKA)</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="number"
                  className="immi-input pl-12"
                  value={formData.jumlah_orang_asing}
                  onChange={(e) => setFormData({ ...formData, jumlah_orang_asing: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="immi-label">Tingkat Risiko (Berdasarkan Data)</label>
              <select
                className="immi-input"
                value={formData.tingkat_risiko}
                onChange={(e) => setFormData({ ...formData, tingkat_risiko: e.target.value })}
              >
                <option value="Low">Low (Patuh / Nihil Pelanggaran)</option>
                <option value="Medium">Medium (Pernah Teguran Administrasi)</option>
                <option value="High">High (Pernah Deportasi / Pro-Justitia)</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="immi-label">Riwayat Pelanggaran Perusahaan</label>
              <div className="relative">
                <History className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  className="immi-input pl-12"
                  value={formData.riwayat_pelanggaran}
                  onChange={(e) => setFormData({ ...formData, riwayat_pelanggaran: e.target.value })}
                  placeholder="Sebutkan riwayat jika ada..."
                />
              </div>
              <p className="text-[10px] text-slate-400 italic">Data ini digunakan untuk menentukan tingkat kerawanan wilayah secara otomatis.</p>
            </div>
          </div>
        )}

        {activeTab === 'Desa Binaan' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="space-y-2">
              <label className="immi-label">Kerentanan TPPO</label>
              <select
                className="immi-input"
                value={formData.kerentanan_tppo}
                onChange={(e) => setFormData({ ...formData, kerentanan_tppo: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="immi-label">Kerentanan TPPM</label>
              <select
                className="immi-input"
                value={formData.kerentanan_tppm}
                onChange={(e) => setFormData({ ...formData, kerentanan_tppm: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="immi-label">Status Program Binaan</label>
              <select
                className="immi-input"
                value={formData.status_binaan}
                onChange={(e) => setFormData({ ...formData, status_binaan: e.target.value })}
              >
                <option value="Aktif">Aktif (Sudah Sosialisasi)</option>
                <option value="Rencana">Rencana (Target 2024/2025)</option>
                <option value="Rintisan">Rintisan (Tahap Awal)</option>
              </select>
            </div>
          </div>
        )}

        {activeTab === 'Titik Rentan' && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-2">
            <label className="immi-label">Tingkat Risiko Keamanan</label>
            <select
              className="immi-input"
              value={formData.tingkat_risiko}
              onChange={(e) => setFormData({ ...formData, tingkat_risiko: e.target.value })}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="immi-label">Koordinat Latitude</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="number"
                step="any"
                required
                className="immi-input pl-12"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="-1.6123"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="immi-label">Koordinat Longitude</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="number"
                step="any"
                required
                className="immi-input pl-12"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="103.6123"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="immi-label">Keterangan / Deskripsi Tambahan</label>
          <textarea
            className="immi-input h-32 resize-none"
            value={formData.keterangan}
            onChange={(e) => setFormData({ ...formData, keterangan: e.target.value })}
            placeholder="Berikan detail tambahan mengenai lokasi ini..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full immi-btn flex items-center justify-center gap-3 text-lg"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <PlusCircle size={20} />
              Simpan Data Lokasi
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-bold transition-all ${
        active 
          ? 'bg-white text-immi-blue shadow-sm' 
          : 'text-slate-400 hover:text-slate-600'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
