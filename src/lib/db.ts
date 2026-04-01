import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'sijambi_pora.db');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    two_factor_secret TEXT,
    is_two_factor_enabled BOOLEAN DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS map_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama_lokasi TEXT NOT NULL,
    kategori TEXT NOT NULL, -- 'Perusahaan' | 'Titik Rentan' | 'Desa Binaan'
    tingkat_risiko TEXT NOT NULL, -- 'Low' | 'Medium' | 'High'
    keterangan TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    -- New fields for Perusahaan
    jumlah_orang_asing INTEGER DEFAULT 0,
    riwayat_pelanggaran TEXT, -- JSON or string
    -- New fields for Desa Binaan
    kerentanan_tppo TEXT, -- 'Low' | 'Medium' | 'High'
    kerentanan_tppm TEXT, -- 'Low' | 'Medium' | 'High'
    status_binaan TEXT, -- 'Aktif' | 'Rencana'
    created_by_user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by_user_id) REFERENCES users(id)
  );
`);

export default db;
