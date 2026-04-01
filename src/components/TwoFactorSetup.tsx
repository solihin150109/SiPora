import React, { useState, useEffect } from 'react';
import { ShieldCheck, QrCode, CheckCircle2, AlertCircle } from 'lucide-react';

export default function TwoFactorSetup() {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const fetchSetup = async () => {
    try {
      const res = await fetch('/api/2fa/setup');
      const data = await res.json();
      setQrCodeUrl(data.qrCodeUrl);
    } catch (err) {
      setError('Gagal memuat setup 2FA');
    }
  };

  useEffect(() => {
    fetchSetup();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      if (!res.ok) throw new Error('Kode verifikasi salah');
      
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-green-100 shadow-sm text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">2FA Berhasil Diaktifkan</h2>
        <p className="text-gray-600">Akun Anda sekarang lebih aman dengan Google Authenticator.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-blue-600" size={24} />
        <h2 className="text-xl font-bold text-gray-800">Setup Google Authenticator</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            1. Scan QR Code di samping menggunakan aplikasi Google Authenticator atau Authy di ponsel Anda.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            2. Masukkan 6 digit kode yang muncul di aplikasi untuk memverifikasi dan mengaktifkan 2FA.
          </p>

          <form onSubmit={handleVerify} className="pt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Kode Verifikasi</label>
              <input
                type="text"
                required
                maxLength={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-2xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Aktifkan 2FA'}
            </button>
          </form>
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48 mix-blend-multiply" />
          ) : (
            <div className="w-48 h-48 flex items-center justify-center text-gray-400">
              <QrCode size={48} className="animate-pulse" />
            </div>
          )}
          <p className="mt-4 text-xs text-gray-400 font-medium uppercase tracking-widest">Scan QR Code</p>
        </div>
      </div>
    </div>
  );
}
