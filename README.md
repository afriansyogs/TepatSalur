# TepatSalur - Platform Koordinasi dan Distribusi Logistik Bencana Cerdas

**TepatSalur** adalah platform manajemen logistik bencana terpadu yang dirancang untuk mempercepat, mengoptimalkan, dan menyeimbangkan distribusi bantuan kemanusiaan ke posko-posko pengungsian secara adil dan tepat sasaran menggunakan teknologi Kecerdasan Buatan (AI).

---

## Fitur Utama & Arsitektur AI

### 1. Triase Posko Cerdas (AI Triage)
Menganalisis tingkat kedaruratan posko secara dinamis menggunakan model **Gemini AI**. Sistem mengevaluasi jumlah kelompok rentan (anak-anak, lansia, ibu hamil, penyandang disabilitas), catatan medis darurat, serta daftar kebutuhan mendesak untuk menghasilkan skor urgensi (0-100) dan klasifikasi status visual (**MERAH** / **KUNING** / **HIJAU**).

### 2. Rekomendasi Distribusi Proporsional (AI Allocation)
Membagi stok logistik dari gudang penyimpanan ke posko-posko pengungsian secara proporsional dan adil. AI tidak hanya memprioritaskan posko berkondisi merah, tetapi juga menyeimbangkan pembagian stok agar posko kuning tidak eskalasi menjadi merah akibat kelangkaan bantuan.

### 3. Masukan Suara AI (AI Voice Parsing - Hands-free)
Memungkinkan relawan posko di lapangan untuk melakukan pembaruan data pengungsi dan pengajuan kebutuhan logistik secara cepat menggunakan perintah suara. File audio ditranskripsikan dan diekstrak menjadi data terstruktur (JSON) menggunakan teknologi Speech-to-Text bertenaga AI, tidak hanya menuliskan namun juga memberikan saran.

### 4. Sistem Pemetaan & Penentuan Rute (Interactive Maps)
Visualisasi berbasis peta interaktif yang memetakan posisi geografis posko pengungsian dan gudang logistik, serta menghitung estimasi jarak rute dan waktu tempuh kurir secara presisi.

---

## 👥 Peran Pengguna (User Roles)

1. **Super Admin (Manajer Komunitas)**
   - Mengelola data posko, gudang logistik, dan pendaftaran anggota baru.
   - Melakukan penugasan (*assignment*) relawan ke lokasi tertentu.
   - Memantau dasbor analitik status bencana di tingkat komunitas.

2. **Relawan Posko (Volunteer - Posko)**
   - Mengelola profil posko dan memutakhirkan data demografi pengungsi.
   - Melaporkan kebutuhan logistik baru secara manual maupun lewat suara (AI).
   - Memantau status pengiriman bantuan logistik yang sedang menuju ke posko.

3. **Relawan Inventory (Volunteer - Gudang)**
   - Mengelola stok logistik masuk dari donatur (konfirmasi kedatangan barang).
   - Menambahkan stok gudang secara manual.
   - Menjalankan perintah distribusi berdasarkan rekomendasi alokasi yang disarankan oleh AI.

4. **Donatur (Donors)**
   - Mengajukan donasi baru melalui formulir donasi.
   - Mendapatkan rekomendasi hub gudang logistik terdekat berdasarkan lokasi penjemputan barang.
   - Melacak status kurir penjemputan barang donasi.

---

## 🛠️ Langkah-Langkah Menjalankan Project (Quick Start Guide)

Ikuti langkah-langkah berikut untuk mengonfigurasi dan menjalankan aplikasi TepatSalur di komputer Anda dengan lancar:

### Prasyarat (Prerequisites)
* Node.js versi 18 atau yang terbaru (direkomendasikan versi LTS).
* Akun Supabase (untuk database dan otentikasi).
* API Key Google Gemini (untuk fitur AI).

### 1. Kloning Repositori & Install Dependensi
Buka terminal Anda, masuk ke direktori proyek, lalu jalankan perintah berikut:
```bash
# Install seluruh pustaka dependensi proyek
npm install
```

### 2. Konfigurasi Environment Variables
Buat berkas bernama `.env` di direktori utama proyek Anda, lalu salin baris konfigurasi berikut dan sesuaikan nilainya:

```env
# Koneksi Supabase (Dapatkan dari project settings API di Supabase Dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-id>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your-anon-key>

# Supabase Admin Key (Opsional, digunakan untuk bypass RLS di server-side jika diperlukan)
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Kunci API Google Gemini (Buat di Google AI Studio)
GEMINI_API_KEY_STT=<your-gemini-api-key>
GEMINI_API_KEY_URGENT=<your-gemini-api-key>
GEMINI_API_KEY_DISTRIBUTION=<your-gemini-api-key>
```

### 3. Migrasi & Skema Database (Supabase)
Sebelum menjalankan aplikasi, pastikan tabel-tabel berikut telah dibuat di database Supabase Anda:
* `users` — Data akun pengguna dan perannya (SUPER_ADMIN, RELAWAN, DONATUR).
* `relawan_assignments` — Penugasan aktif relawan ke Posko atau Gudang.
* `posko` — Data titik pengungsian dan statistik demografi.
* `posko_kebutuhan` — Kebutuhan barang posko.
* `donasi` — Data bantuan masuk dari donatur.
* `inventory_locations` — Lokasi fisik gudang logistik.
* `inventory_items` — Stok barang logistik yang tersedia di gudang.
* `ai_log` — Log historis analisis AI (triage, STT, distribusi).

*Tip: Jalankan skema tabel dan migrasi trigger database yang disediakan pada berkas dokumentasi di dalam folder `md/` jika diperlukan.*

### 4. Jalankan Development Server
Setelah dependensi terpasang dan environment terkonfigurasi, jalankan server lokal:
```bash
npm run dev
```

Buka peramban (browser) Anda dan kunjungi tautan **[http://localhost:3000](http://localhost:3000)** untuk melihat aplikasi berjalan.
