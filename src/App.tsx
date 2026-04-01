import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Map as MapIcon, 
  Settings, 
  LogOut, 
  User as UserIcon,
  LayoutDashboard,
  Menu,
  X,
  Lock,
  Mail,
  KeyRound,
  AlertCircle,
  PlusCircle,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { User, MapPoint } from './types';
import MapView from './components/Map';
import PointForm from './components/PointForm';
import TwoFactorSetup from './components/TwoFactorSetup';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'login' | '2fa-verify' | 'dashboard' | 'data-entry' | 'settings'>('login');
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setView('dashboard');
        fetchPoints();
      }
    } catch (err) {
      // Not logged in
    } finally {
      setLoading(false);
    }
  };

  const fetchPoints = async () => {
    try {
      const res = await fetch('/api/points');
      if (res.ok) {
        const data = await res.json();
        setPoints(data);
      }
    } catch (err) {
      console.error('Failed to fetch points');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Login gagal');

      if (data.needs2FA) {
        setView('2fa-verify');
      } else {
        setUser(data.user);
        setView('dashboard');
        fetchPoints();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: twoFactorCode })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Kode salah');

      setUser(data.user);
      setView('dashboard');
      fetchPoints();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    setUser(null);
    setView('login');
    setAuthForm({ email: '', password: '' });
    setTwoFactorCode('');
  };

  // Chart Data Calculations
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    points.forEach(p => {
      counts[p.kategori] = (counts[p.kategori] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [points]);

  const riskData = useMemo(() => {
    const counts: Record<string, number> = { 'Low': 0, 'Medium': 0, 'High': 0 };
    points.forEach(p => {
      counts[p.tingkat_risiko] = (counts[p.tingkat_risiko] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [points]);

  const COLORS = ['#002366', '#DC2626', '#D4AF37', '#1A1A1A'];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-immi-blue border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Memuat Sijambi-Pora...</p>
        </div>
      </div>
    );
  }

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 overflow-hidden"
        >
          <div className="bg-immi-blue p-8 text-white text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Shield size={32} />
            </div>
            <h1 className="text-2xl font-bold">Sijambi-Pora</h1>
            <p className="text-blue-100 text-sm mt-1">Kantor Imigrasi Kelas I TPI Jambi</p>
          </div>
          
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-3 border border-red-100">
                <AlertCircle size={20} />
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Petugas</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-immi-blue focus:outline-none transition-all"
                    placeholder="petugas@imigrasi.go.id"
                    value={authForm.email}
                    onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Kata Sandi</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-immi-blue focus:outline-none transition-all"
                    placeholder="••••••••"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <button 
              type="submit"
              className="w-full py-4 bg-immi-blue hover:bg-immi-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 group"
            >
              Masuk Sistem
              <motion.div whileHover={{ x: 5 }}>
                <KeyRound size={18} />
              </motion.div>
            </button>
            
            <p className="text-center text-slate-400 text-xs">
              Sistem Pemetaan Wilayah Kerja & Titik Rentan Orang Asing
            </p>
          </form>
        </motion.div>
      </div>
    );
  }

  if (view === '2fa-verify') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 p-8 text-center"
        >
          <div className="w-20 h-20 bg-blue-50 text-immi-blue rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Shield size={40} />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifikasi 2FA</h2>
          <p className="text-slate-500 text-sm mb-8">
            Masukkan 6 digit kode dari aplikasi Google Authenticator Anda.
          </p>
          
          <form onSubmit={handleVerify2FA} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-xl flex items-center gap-3 border border-red-100">
                <AlertCircle size={20} />
                {error}
              </div>
            )}
            
            <input 
              type="text" 
              required
              maxLength={6}
              autoFocus
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-center text-4xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-immi-blue focus:outline-none transition-all"
              placeholder="000000"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
            />
            
            <button 
              type="submit"
              disabled={twoFactorCode.length !== 6}
              className="w-full py-4 bg-immi-blue hover:bg-immi-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              Verifikasi & Masuk
            </button>
            
            <button 
              type="button"
              onClick={() => setView('login')}
              className="text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors"
            >
              Kembali ke Login
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-white border-r border-slate-200 flex flex-col z-20"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-immi-blue rounded-xl flex items-center justify-center text-white">
                <Shield size={20} />
              </div>
              <span className="font-bold text-slate-800 tracking-tight">Sijambi-Pora</span>
            </motion.div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={view === 'dashboard'} 
            collapsed={!isSidebarOpen}
            onClick={() => setView('dashboard')}
          />
          <SidebarItem 
            icon={<PlusCircle size={20} />} 
            label="Input Data" 
            active={view === 'data-entry'} 
            collapsed={!isSidebarOpen}
            onClick={() => setView('data-entry')}
          />
          <SidebarItem 
            icon={<Settings size={20} />} 
            label="Pengaturan 2FA" 
            active={view === 'settings'} 
            collapsed={!isSidebarOpen}
            onClick={() => setView('settings')}
          />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-slate-50 mb-4 ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-8 h-8 bg-blue-100 text-immi-blue rounded-lg flex items-center justify-center">
              <UserIcon size={16} />
            </div>
            {isSidebarOpen && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.email}</p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Petugas Imigrasi</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-bold text-sm ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Keluar</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {view === 'dashboard' ? 'Dashboard Monitoring' : 
               view === 'data-entry' ? 'Input Data Lokasi' : 'Pengaturan Keamanan'}
            </h2>
            <p className="text-slate-400 text-sm">
              {view === 'dashboard' ? 'Analisis statistik & pemetaan wilayah Jambi' : 
               view === 'data-entry' ? 'Tambahkan titik rentan atau perusahaan baru' : 'Konfigurasi autentikasi dua faktor'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-100">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              Sistem Online
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {view === 'dashboard' ? (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    title="Total Titik" 
                    value={points.length} 
                    icon={<MapIcon size={24} />} 
                    color="bg-immi-blue" 
                  />
                  <StatCard 
                    title="Perusahaan" 
                    value={points.filter(p => p.kategori === 'Perusahaan').length} 
                    icon={<TrendingUp size={24} />} 
                    color="bg-blue-500" 
                  />
                  <StatCard 
                    title="Titik Rentan" 
                    value={points.filter(p => p.kategori === 'Titik Rentan').length} 
                    icon={<AlertCircle size={24} />} 
                    color="bg-red-500" 
                  />
                  <StatCard 
                    title="Desa Binaan" 
                    value={points.filter(p => p.kategori === 'Desa Binaan').length} 
                    icon={<Shield size={24} />} 
                    color="bg-immi-gold" 
                  />
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Charts */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <PieChartIcon size={18} className="text-immi-blue" />
                        Distribusi Kategori
                      </h3>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        {categoryData.map((entry, index) => (
                          <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="text-[10px] font-medium text-slate-600">{entry.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BarChart3 size={18} className="text-immi-blue" />
                        Tingkat Risiko
                      </h3>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={riskData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#002366" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Map */}
                  <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative min-h-[500px]">
                    <MapView points={points} center={[-1.61, 103.61]} />
                  </div>
                </div>
              </motion.div>
            ) : view === 'data-entry' ? (
              <motion.div 
                key="data-entry"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto"
              >
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-immi-blue text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                      <PlusCircle size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Form Input Data Wilayah</h3>
                      <p className="text-slate-400 text-sm">Pastikan koordinat latitude dan longitude sudah akurat.</p>
                    </div>
                  </div>
                  <PointForm onSuccess={() => {
                    fetchPoints();
                    setView('dashboard');
                  }} />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto"
              >
                <TwoFactorSetup />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, collapsed, onClick }: { 
  icon: React.ReactNode, 
  label: string, 
  active?: boolean, 
  collapsed?: boolean,
  onClick: () => void 
}) {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-3 rounded-xl transition-all font-bold text-sm
        ${active 
          ? 'bg-immi-blue text-white shadow-lg shadow-blue-100' 
          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}
        ${collapsed && 'justify-center'}
      `}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
      <div className={`w-12 h-12 ${color} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-100`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
