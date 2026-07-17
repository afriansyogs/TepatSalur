# Panduan dan Aturan Responsivitas Layout (TepatSalur)

Dokumen ini mendefinisikan aturan wajib dan praktik terbaik untuk merancang serta mengimplementasikan antarmuka pengguna (UI) yang sepenuhnya responsif di seluruh perangkat (mobile, tablet, dan desktop) pada proyek TepatSalur.

---

## 1. Prinsip Utama Responsivitas

Semua halaman dan komponen wajib mematuhi tiga prinsip utama berikut:
* **Mobile-First Approach**: Selalu desain dan tulis kode CSS/Tailwind untuk layar terkecil terlebih dahulu, kemudian tambahkan breakpoint (`sm:`, `md:`, `lg:`, `xl:`) untuk layar yang lebih besar.
* **Fluid & Flexible Layouts**: Hindari penggunaan ukuran piksel tetap (`width: 500px`) untuk kontainer utama. Gunakan persentase, viewport units (`vw`, `vh`), atau flex/grid-based sizing.
* **Aksesibilitas & Keterbacaan**: Pastikan ukuran font, tombol, dan area sentuh mudah diakses pada perangkat mobile (minimal area sentuh adalah 44x44 piksel).

---

## 2. Breakpoint Standar Tailwind CSS

Gunakan breakpoint bawaan Tailwind CSS secara konsisten untuk menjaga keselarasan tata letak:

| Breakpoint | Lebar Minimum | Target Perangkat |
| :--- | :--- | :--- |
| *(Default)* | `>= 0px` | Ponsel Pintar / Mobile (Potret) |
| `sm` | `>= 640px` | Ponsel Pintar Besar (Lanskap) |
| `md` | `>= 768px` | Tablet |
| `lg` | `>= 1024px` | Laptop / Desktop Kecil |
| `xl` | `>= 1280px` | Desktop Standar |
| `2xl` | `>= 1536px` | Monitor Lebar |

---

## 3. Aturan Implementasi Layout & Grid

### 3.1 Kontainer Utama (Wrapper)
Setiap halaman wajib dibungkus dengan kontainer yang membatasi lebar maksimum halaman pada layar besar agar konten tidak terlalu melebar:
```tsx
// Contoh pembungkus halaman standar
<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* Konten Halaman */}
</div>
```

### 3.2 Flexbox dan Grid Responsif
* Gunakan CSS Grid untuk tata letak kolom yang berubah jumlahnya tergantung ukuran layar.
* Gunakan Flexbox untuk tata letak satu dimensi yang arah alirannya berubah (`flex-col` ke `flex-row`).

```tsx
// Grid Responsif: 1 kolom di mobile, 2 di tablet, 3 di desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <DonasiCard key={item.id} data={item} />
  ))}
</div>

// Flexbox Responsif: Menumpuk vertikal di mobile, horizontal di desktop
<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
  <div>
    <h2 className="text-xl font-bold">Daftar Penerima Manfaat</h2>
    <p className="text-muted-foreground">Data penyaluran bantuan terbaru</p>
  </div>
  <Button className="w-full md:w-auto">
    Tambah Penerima
  </Button>
</div>
```

---

## 4. Komponen Khusus Responsif

### 4.1 Navigasi Utama (Navbar)
* **Mobile**: Sembunyikan tautan menu utama. Tampilkan logo dan tombol menu hamburger. Ketika ditekan, tampilkan navigasi menggunakan komponen Drawer/Sheet dari shadcn/ui.
* **Desktop (`md:` ke atas)**: Tampilkan seluruh tautan navigasi secara horizontal dan sembunyikan tombol menu hamburger.

### 4.2 Sidebar Dashboard
* **Mobile**: Sembunyikan sidebar secara default. Gunakan trigger menu hamburger untuk menampilkan sidebar secara melayang (*overlay*) dengan Sheet/Drawer.
* **Desktop (`lg:` ke atas)**: Tampilkan sidebar secara permanen di sisi kiri halaman dengan lebar tetap (contoh: `w-64` atau `w-72`).

### 4.3 Form Responsif
* Field input harus selalu memiliki lebar penuh (`w-full`) di perangkat mobile.
* Gunakan grid untuk menyejajarkan beberapa field input di layar yang lebih besar.

```tsx
<form className="space-y-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="firstName">Nama Depan</Label>
      <Input id="firstName" className="w-full" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="lastName">Nama Belakang</Label>
      <Input id="lastName" className="w-full" />
    </div>
  </div>
  <div className="space-y-2">
    <Label htmlFor="email">Alamat Email</Label>
    <Input id="email" type="email" className="w-full" />
  </div>
</form>
```

### 4.4 Tabel Data
Tabel bawaan HTML sering kali rusak di layar kecil. Aturan penanganannya adalah:
1. Bungkus elemen `table` dengan kontainer yang memiliki properti `overflow-x-auto`.
2. Untuk pengalaman seluler yang lebih baik, pertimbangkan mengubah representasi tabel menjadi barisan kartu (*cards*) khusus untuk layar di bawah `md`.

```tsx
// Pendekatan horizontal scroll
<div className="w-full overflow-x-auto rounded-lg border">
  <table className="w-full min-w-[600px] text-sm">
    {/* Isi Tabel */}
  </table>
</div>
```

---

## 5. Tipografi dan Jarak (Spacing)

### 5.1 Tipografi Responsif
Gunakan ukuran font yang menyesuaikan dengan ukuran layar. Hindari teks berukuran sangat besar pada layar ponsel.
```tsx
// Judul utama yang mengecil di mobile dan membesar di desktop
<h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
  TepatSalur: Penyaluran Bantuan Transparan
</h1>
```

### 5.2 Jarak (Padding & Margin)
Sesuaikan padding kontainer dan jarak antar elemen agar sesuai dengan proporsi layar.
```tsx
// Padding vertikal yang lebih besar di layar besar
<section className="py-8 md:py-16 lg:py-24">
  {/* Konten */}
</section>
```

---

## 6. Integrasi dengan shadcn/ui

Gunakan pola hibrida untuk dialog/modal interaktif demi kenyamanan pengguna:
* Gunakan **Drawer** (geser dari bawah) pada layar mobile (`< md`).
* Gunakan **Dialog** (modal di tengah) pada layar desktop (`>= md`).

---

## 7. Checklist Uji Kelayakan Responsivitas

Sebelum menyatakan sebuah halaman selesai dibangun, lakukan pengujian berikut:
1. [ ] **No Horizontal Scroll**: Halaman tidak boleh memicu horizontal scrollbar pada browser saat diperkecil hingga lebar `320px` (kecuali pada kontainer tabel data yang diizinkan scroll horizontal).
2. [ ] **Touch Target Size**: Seluruh tombol, link, dan elemen interaktif lainnya memiliki ukuran minimal `44x44px` atau jarak yang cukup agar tidak terjadi salah tekan.
3. [ ] **No Content Overlap**: Teks tidak menumpuk dengan gambar atau ikon ketika ukuran layar diubah secara dinamis.
4. [ ] **Image Optimization**: Gambar menggunakan `next/image` dengan konfigurasi responsive sizes untuk menghemat bandwidth pada perangkat seluler.