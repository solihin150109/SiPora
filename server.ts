import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { authenticator } = require("otplib");
import qrcode from "qrcode";
import db from "./src/lib/db.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";
const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

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
      kategori TEXT NOT NULL,
      tingkat_risiko TEXT NOT NULL,
      keterangan TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      jumlah_orang_asing INTEGER DEFAULT 0,
      riwayat_pelanggaran TEXT,
      kerentanan_tppo TEXT,
      kerentanan_tppm TEXT,
      status_binaan TEXT,
      created_by_user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by_user_id) REFERENCES users(id)
    );
  `);

  // Seed default user if empty
  const userCount: any = db.prepare("SELECT COUNT(*) as count FROM users").get();
  if (userCount.count === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run("admin@imigrasi.go.id", hashedPassword);
    console.log("Default user created: admin@imigrasi.go.id / admin123");
  }

  // Seed default points if empty
  const pointCount: any = db.prepare("SELECT COUNT(*) as count FROM map_points").get();
  if (pointCount.count === 0) {
    const seedPoints = [
      {
        nama_lokasi: "PT. Jambi Sawit Sejahtera",
        kategori: "Perusahaan",
        tingkat_risiko: "Low",
        keterangan: "Perusahaan pengolahan sawit dengan 15 TKA asal Tiongkok.",
        latitude: -1.6123,
        longitude: 103.6123,
        jumlah_orang_asing: 15,
        riwayat_pelanggaran: "Tidak ada",
        created_by_user_id: 1
      },
      {
        nama_lokasi: "Pelabuhan Talang Duku",
        kategori: "Titik Rentan",
        tingkat_risiko: "High",
        keterangan: "Pintu masuk logistik utama, rawan penyelundupan.",
        latitude: -1.5543,
        longitude: 103.7012,
        created_by_user_id: 1
      },
      {
        nama_lokasi: "Desa Mendalo Indah",
        kategori: "Desa Binaan",
        tingkat_risiko: "Medium",
        keterangan: "Desa dengan mobilitas warga ke luar negeri tinggi.",
        latitude: -1.6345,
        longitude: 103.5234,
        kerentanan_tppo: "Medium",
        kerentanan_tppm: "Low",
        status_binaan: "Aktif",
        created_by_user_id: 1
      },
      {
        nama_lokasi: "Bandara Sultan Thaha",
        kategori: "Titik Rentan",
        tingkat_risiko: "Medium",
        keterangan: "Pemeriksaan dokumen perjalanan diperketat.",
        latitude: -1.6389,
        longitude: 103.6456,
        created_by_user_id: 1
      },
      {
        nama_lokasi: "PT. Sumber Energi Jambi",
        kategori: "Perusahaan",
        tingkat_risiko: "High",
        keterangan: "Pernah ada temuan TKA tanpa IMTA tahun 2023.",
        latitude: -1.7012,
        longitude: 103.4567,
        jumlah_orang_asing: 42,
        riwayat_pelanggaran: "Penyalahgunaan Izin Tinggal (2023)",
        created_by_user_id: 1
      }
    ];

    const insertStmt = db.prepare(`
      INSERT INTO map_points (
        nama_lokasi, kategori, tingkat_risiko, keterangan, latitude, longitude,
        jumlah_orang_asing, riwayat_pelanggaran, kerentanan_tppo, kerentanan_tppm, status_binaan, created_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    seedPoints.forEach(p => {
      insertStmt.run(
        p.nama_lokasi, p.kategori, p.tingkat_risiko, p.keterangan, p.latitude, p.longitude,
        p.jumlah_orang_asing || 0, p.riwayat_pelanggaran || null,
        p.kerentanan_tppo || null, p.kerentanan_tppm || null, p.status_binaan || null,
        p.created_by_user_id
      );
    });
    console.log("Seed points created.");
  }

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // --- Auth Routes ---

  // Register (for initial setup/demo)
  app.post("/api/register", async (req, res) => {
    const { email, password } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)");
      const result = stmt.run(email, hashedPassword);
      res.json({ id: result.lastInsertRowid, email });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Login
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // If 2FA is enabled, don't give final token yet
    if (user.is_two_factor_enabled) {
      const tempToken = jwt.sign({ id: user.id, email: user.email, needs2FA: true }, JWT_SECRET, { expiresIn: "5m" });
      res.cookie("temp_token", tempToken, { httpOnly: true, secure: true, sameSite: "none" });
      return res.json({ needs2FA: true });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
    res.json({ success: true, user: { email: user.email, id: user.id } });
  });

  // 2FA Setup
  app.get("/api/2fa/setup", authenticateToken, async (req: any, res) => {
    const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    
    // Generate new secret if not exists or if requested
    const secret = authenticator.generateSecret();
    db.prepare("UPDATE users SET two_factor_secret = ? WHERE id = ?").run(secret, user.id);

    const otpauth = authenticator.keyuri(user.email, "Sijambi-Pora", secret);
    const qrCodeUrl = await qrcode.toDataURL(otpauth);

    res.json({ qrCodeUrl, secret });
  });

  // 2FA Enable (Verify first code)
  app.post("/api/2fa/enable", authenticateToken, async (req: any, res) => {
    const { code } = req.body;
    const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);

    if (!user.two_factor_secret) return res.status(400).json({ error: "2FA not set up" });

    const isValid = authenticator.check(code, user.two_factor_secret);
    if (!isValid) return res.status(400).json({ error: "Invalid code" });

    db.prepare("UPDATE users SET is_two_factor_enabled = 1 WHERE id = ?").run(user.id);
    res.json({ success: true });
  });

  // 2FA Verify (During Login)
  app.post("/api/2fa/verify", async (req, res) => {
    const { code } = req.body;
    const tempToken = req.cookies.temp_token;

    if (!tempToken) return res.status(401).json({ error: "Session expired" });

    try {
      const decoded: any = jwt.verify(tempToken, JWT_SECRET);
      const user: any = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id);

      const isValid = authenticator.check(code, user.two_factor_secret);
      if (!isValid) return res.status(400).json({ error: "Invalid code" });

      const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
      res.clearCookie("temp_token");
      res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none" });
      res.json({ success: true, user: { email: user.email, id: user.id } });
    } catch (error) {
      res.status(401).json({ error: "Invalid session" });
    }
  });

  // Logout
  app.post("/api/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ success: true });
  });

  // Get Current User
  app.get("/api/me", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const user = jwt.verify(token, JWT_SECRET);
      res.json(user);
    } catch (error) {
      res.status(401).json({ error: "Invalid token" });
    }
  });

  // --- Map Points Routes ---

  app.get("/api/points", authenticateToken, (req, res) => {
    const points = db.prepare("SELECT * FROM map_points").all();
    res.json(points);
  });

  app.post("/api/points", authenticateToken, (req: any, res) => {
    const { 
      nama_lokasi, kategori, tingkat_risiko, keterangan, latitude, longitude,
      jumlah_orang_asing, riwayat_pelanggaran,
      kerentanan_tppo, kerentanan_tppm, status_binaan
    } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO map_points (
          nama_lokasi, kategori, tingkat_risiko, keterangan, latitude, longitude, 
          jumlah_orang_asing, riwayat_pelanggaran,
          kerentanan_tppo, kerentanan_tppm, status_binaan,
          created_by_user_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        nama_lokasi, kategori, tingkat_risiko, keterangan, latitude, longitude,
        jumlah_orang_asing || 0, riwayat_pelanggaran || null,
        kerentanan_tppo || null, kerentanan_tppm || null, status_binaan || null,
        req.user.id
      );
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
