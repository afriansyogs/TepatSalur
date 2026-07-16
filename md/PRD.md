# Product Requirements Document (PRD)
**Project Name:** TepatSalur  
**Theme:** Safety (Disaster Preparedness & Response)  
**Document Status:** MVP Final (Hackathon Edition)  

## 1. Executive Summary
TepatSalur adalah platform manajemen krisis dan logistik bencana berbasis AI yang dirancang untuk mempercepat dan meratakan distribusi bantuan. Dengan memanfaatkan kecerdasan buatan untuk sistem triase posko otomatis, pemetaan donasi pintar, asisten input suara (*Speech-to-Text*), dan manajemen basis data *real-time*, sistem ini mencegah penumpukan logistik di satu titik sekaligus memastikan posko dengan urgensi tertinggi mendapatkan prioritas utama melalui rantai komando komunitas relawan yang terstruktur.

## 2. Problem Statement
Dalam situasi tanggap darurat bencana di Indonesia, tantangan terbesar bukanlah kurangnya bantuan, melainkan **asimetri informasi, miskoordinasi komando, dan lambatnya pendataan**.
* **Oversupply & Blindspot:** Posko strategis kelebihan logistik (*race condition*), sementara posko terpencil dengan banyak lansia/balita sakit terabaikan.
* **Kelelahan Pendataan:** Relawan di lapangan kewalahan mengetik laporan kebutuhan di tengah situasi chaos.
* **Kebingungan Donatur:** Masyarakat ingin menyumbang tapi tidak tahu harus mengirim barang ke gudang/titik mana yang valid dan terdekat.

## 3. User Personas & Onboarding Flow
Sistem ini menggunakan *Role-Based Access Control* (RBAC) dengan alur registrasi spesifik:

1. **Super Admin (Kordinator Komunitas):**
   * **Onboarding:** Mendaftar dengan membuat entitas Komunitas. Memasukkan data lokasi Gudang Utama (*Inventory*) beserta foto bukti fisik.
   * **Tugas:** Menyetujui (*approve*) pendaftaran Relawan dan menugaskan mereka ke titik Gudang atau Posko spesifik.
2. **Relawan (Eksekutor Lapangan):**
   * **Onboarding:** Wajib mengisi profil lengkap (KTP/identitas untuk kredibilitas) dan memilih Komunitas yang ingin diikuti (status *Pending* hingga di-*approve* Super Admin).
   * **Role Cabang:**
     * **Relawan Inventory:** Menyetujui/menolak drop donasi dari Donatur, memanajemen stok gudang, dan mengonfirmasi pengiriman barang ke Posko.
     * **Relawan Posko:** Berada di titik pengungsian. Mendata metrik rentan (balita, lansia, luka) dan *request* kebutuhan barang secara dinamis. Menerima kedatangan barang dari Gudang.
3. **Donatur Publik:**
   * **Onboarding:** Registrasi instan (tanpa wajib lengkapi profil KTP).
   * **Tugas:** Menginput barang yang akan didonasikan beserta lokasi mereka saat ini via Map.

## 4. Core Features (MVP untuk Hackathon)

### A. Multi-Agent AI System (Gemini API)
* **Smart Voice-to-Form (Relawan Posko):** Relawan cukup menekan tombol *mic* dan berbicara (contoh: *"Di sini ada 5 balita, 2 lansia luka-luka, butuh 2 dus susu dan 1 dus perban"*). AI akan mem-*parsing* suara tersebut menjadi data terstruktur dan otomatis mengisi *dynamic form* multi-baris tanpa perlu mengetik manual.
* **Smart Triage (Posko Urgency):** AI menganalisis data pengungsi dan catatan medis darurat untuk menghasilkan warna status (Merah/Kuning/Hijau) dan Skor Urgensi (0-100).
* **Donation Routing (Untuk Donatur):** AI membaca koordinat Donatur dan merekomendasikan Gudang Komunitas (*Inventory*) terdekat untuk *drop-off* barang, lengkap dengan panduan arah peta.
* **Distribution Matchmaker (Untuk Relawan Inventory):** AI merekomendasikan penyaluran barang gudang ke posko-posko berdasarkan kategori kebutuhan dan skor urgensi tertinggi, memastikan barang tepat sasaran.

### B. Distribusi Logistik Anti-Overlapping (*Race Condition Prevention*)
* Menggunakan teknik *Row-Level Locking* di PostgreSQL. Saat Relawan Inventory mengeklik "Kirim Bantuan" untuk memenuhi *request* 40 paket ke Posko A, kuota kebutuhan Posko A langsung terkunci (*booked*). Relawan gudang lain tidak akan bisa mengirim barang yang sama melebihi batas kebutuhan.

## 5. Technology Stack (100% Serverless & Free Tier)
* **Frontend & Backend Utama:** Next.js (App Router) + Tailwind CSS + shadcn/ui.
* **Database & Auth:** Supabase (PostgreSQL) — menangani *authentication*, RPC *transaction*, dan *real-time subscription*.
* **AI Engine:** Google Gemini API.
* **Deployment:** Vercel.

## 6. Security & Data Integrity
* **Kredibilitas Relawan:** Mandatory profil dan penugasan berlapis oleh Super Admin menjaga sistem dari *spam* oknum tak bertanggung jawab.
* **Row Level Security (RLS):** Diterapkan ketat di Supabase. Donatur hanya melihat donasinya, Relawan hanya mengelola tugas di titik tugasnya, Super Admin memiliki kontrol penuh atas komunitasnya.
* **Atomic RPC:** Pencegahan absolut terhadap manipulasi kuota bantuan yang bocor akibat *concurrent requests*.

## 7. Demo Strategy (Skenario Pitching Hackathon)
1. **The "Magic" Voice Input:** Tunjukkan layar Relawan Posko. Demonstrasikan berbicara ke aplikasi tentang kondisi darurat dan kebutuhan spesifik. Tunjukkan bagaimana *dynamic form* tiba-tiba terisi rapi secara otomatis dan status posko langsung berubah menjadi MERAH. Juri sangat menyukai efek "wow" dari otomatisasi UI ini.
2. **The Smart Logistics Flow:** Buka layar Donatur yang mendonasikan obat. Tunjukkan bagaimana obat masuk ke *Inventory*. Lalu pindah ke layar Relawan Inventory, tunjukkan bagaimana sistem AI menyarankan obat tersebut dikirim tepat ke Posko MERAH yang baru saja mendata kebutuhan via suara tadi.
3. **The Concurrency Test:** Klik "Kirim Bantuan" di satu jendela, dan tunjukkan bagaimana sisa kebutuhan logistik di posko pada jendela *browser* kedua langsung terpotong seketika (Real-Time) tanpa perlu *refresh*.