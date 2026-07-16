Saya ingin membuat proyek website baru menggunakan Next.js (App Router) dan TypeScript. Tolong gunakan struktur direktori dan manajemen data UI yang terpisah seperti panduan berikut untuk seluruh pengembangan proyek ini:

# 1. Tech Stack Utama
- **Framework:** Next.js 15+ (App Router)
- **Bahasa:** TypeScript (Strict Mode)
- **Styling & UI:** Tailwind CSS & shadcn/ui
- **Validasi & Form:** Zod & React Hook Form
- **Database/Auth:** Supabase

# 2. Struktur Direktori Wajib
Tolong susun dan letakkan file secara disiplin pada struktur berikut:
- `app/`: HANYA untuk routing Next.js (`page.tsx`, `layout.tsx`, `loading.tsx`) dan API Routes (`app/api/`).
- `components/ui/`: Khusus untuk komponen dasar yang re-usable dari shadcn/ui (contoh: button, input, dialog).
- `components/[nama-fitur]/`: Untuk komponen spesifik per fitur (contoh: `components/home/Hero.tsx`). Selalu pisahkan antara Client Component (`"use client"`) dan Server Component.
- `services/`: Lapisan logika bisnis dan API/Database call. JANGAN MELAKUKAN fetch data atau query database langsung di dalam file komponen UI. Lakukan di service, lalu panggil service tersebut di UI/Server Component.
- `schemas/`: Tempat menyimpan semua Zod schema untuk validasi form dan payload API.
- `types/`: Tempat menyimpan deklarasi interface dan type TypeScript secara global.
- `lib/`: Fungsi utilitas murni (contoh: formatter tanggal, `cn` tailwind merge).
- `docsApi/`: Tempat untuk menyimpan dokumentasi penggunaan endpoint API jika membuat custom route. File di folder ini wajib dibuat segera setelah API selesai dibuat dan wajib diperbarui secara berkala setiap kali terjadi perubahan struktur atau logika pada API terkait.

# 3. Manajemen UI Data & Validasi
- **Pemisahan Logika (Services Layer):** Komponen UI hanya bertugas menampilkan data. Semua logika pemanggilan eksternal (fetch) wajib dibuat sebagai fungsi di dalam folder `services/`.
- **Standarisasi Penamaan (Mapping):** Jika database menggunakan `snake_case`, fungsi di `services/` WAJIB memetakan (map) response tersebut menjadi `camelCase` sebelum dikirimkan dan digunakan oleh komponen UI.
- **Form Data:** Semua form di UI wajib dikelola menggunakan `react-hook-form` yang di-resolve menggunakan `zodResolver` berdasarkan skema dari folder `schemas/`.

# 4. Aturan Penamaan (Naming Convention)
- **Variabel, Fungsi, Properti:** `camelCase` (contoh: `userData`, `fetchProducts()`).
- **File Komponen React:** `PascalCase` (contoh: `ProductCard.tsx`).
- **File Non-Komponen (services, utils, dll):** `camelCase` atau `kebab-case` (contoh: `user.service.ts` atau `user-service.ts`).

# 5. Keamanan & Kepatuhan Tipe Data (Type Safety & Security)
- **Tipe Data Ketat (Strict Type Safety):** Seluruh kode wajib menggunakan tipe data yang ketat. Penggunaan tipe `any` sangat dilarang. Jika tipe data tidak dapat diprediksi secara dinamis, gunakan `unknown` disertai penanganan type guard atau assertion yang aman.
- **Tipe Generik (Generic Types):** Gunakan generic types pada fungsi utilitas, response API, hook kustom, dan pembungkus data untuk memaksimalkan penggunaan ulang kode dan menjaga integritas tipe.
- **Keamanan Tinggi:** Validasi input secara ketat menggunakan Zod di sisi klien maupun server. Lakukan sanitasi data guna mencegah kerentanan keamanan seperti SQL/XSS Injection.

# 6. Kinerja & Arsitektur (Performance & Architecture)
- **Arsitektur Bersih & Modular:** Terapkan pemisahan tanggung jawab yang jelas (*separation of concerns*). Bagian UI terpisah dari logika bisnis.
- **Component-Based Architecture:** Bangun antarmuka secara modular menggunakan komponen-komponen kecil, terisolasi, dan berfokus pada fungsi presentasi.
- **shadcn/ui First:** Selalu prioritaskan penggunaan komponen dasar dari `shadcn/ui` ketimbang membuat komponen dari awal dengan Tailwind CSS biasa, guna menjaga konsistensi desain dan aksesibilitas.
- **Kinerja Tinggi:** Optimalkan rendering dengan memanfaatkan Server Components secara bawaan, serta membatasi penggunaan Client Components (`"use client"`) hanya pada bagian yang membutuhkan interaktivitas langsung.
- **Komponen Reusable (DRY Principle):** Jika ada elemen UI atau logika yang digunakan berulang kali di berbagai tempat (seperti tombol otentikasi kustom, kartu, atau form), wajb dipisahkan menjadi komponen mandiri (reusable component) di dalam folder `components/ui/` atau sub-folder yang relevan untuk menghindari duplikasi kode (*Don't Repeat Yourself*).

# 7. Gaya Penulisan Kode & Estetika (Code Style & Aesthetics)
- **Hapus Komentar Tidak Penting:** Kode harus bersifat *self-documenting* (jelas dengan sendirinya). Hapus komentar yang hanya menjelaskan apa yang dilakukan kode secara literal. Tulis komentar hanya untuk menjelaskan logika bisnis yang kompleks atau keputusan teknis yang tidak biasa.
- **Larangan Emojis:** Jangan pernah menggunakan emoji di dalam penulisan kode sumber, baik itu pada nama variabel, komentar, maupun pesan log logik.

Harap patuhi aturan di atas setiap kali Anda menggenerasi file, mengubah struktur, atau membuat fitur baru.
