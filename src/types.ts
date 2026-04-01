export interface User {
  id: number;
  email: string;
  is_two_factor_enabled: boolean;
}

export interface MapPoint {
  id: number;
  nama_lokasi: string;
  kategori: 'Perusahaan' | 'Titik Rentan' | 'Desa Binaan';
  tingkat_risiko: 'Low' | 'Medium' | 'High';
  keterangan: string;
  deskripsi?: string;
  latitude: number;
  longitude: number;
  jumlah_orang_asing?: number;
  riwayat_pelanggaran?: string;
  kerentanan_tppo?: 'Low' | 'Medium' | 'High';
  kerentanan_tppm?: 'Low' | 'Medium' | 'High';
  status_binaan?: 'Aktif' | 'Rencana' | 'Rintisan';
  created_at: string;
}
