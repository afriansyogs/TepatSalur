# Dokumentasi API Lokasi (Posko & Inventory)

API ini digunakan oleh `SUPER_ADMIN` untuk mengelola data Posko dan Gudang (Inventory) di dalam komunitas mereka. 

---

## 1. Daftar Lokasi
Mengambil daftar semua Posko dan Gudang dalam komunitas admin, lengkap dengan jumlah total relawan aktif dan 3 item kebutuhan/stok teratas.

* **URL:** `/api/super-admin/locations`
* **Method:** `GET`
* **Auth Required:** Ya (Session Cookie, Role `SUPER_ADMIN`)
* **Headers:** `Content-Type: application/json`

### Response Sukses (`200 OK`)
```json
{
  "success": true,
  "data": {
    "poskos": [
      {
        "id": "uuid-posko-1",
        "type": "POSKO",
        "name": "Posko Pengungsian A",
        "alamat": "Jl. Merdeka No 1",
        "latitude": -6.2,
        "longitude": 106.8,
        "urgencyStatus": "MERAH",
        "urgencyScore": 85,
        "totalVolunteers": 5,
        "needs": [
          { "id": "need-1", "item_name": "Beras", "qty_needed": 100, "qty_fulfilled": 20, "status": "OPEN" }
        ]
      }
    ],
    "inventories": [
      {
        "id": "uuid-inventory-1",
        "type": "INVENTORY",
        "name": "Gudang Utama",
        "alamat": "Jl. Jendral No 2",
        "latitude": -6.3,
        "longitude": 106.9,
        "isActive": true,
        "totalVolunteers": 2,
        "needs": [
          { "id": "item-1", "item_name": "Air Mineral", "category": "MINUMAN", "qty_available": 500 }
        ]
      }
    ]
  }
}
```

---

## 2. Tambah Lokasi Baru
Membuat Posko atau Gudang baru di komunitas Super Admin.

* **URL:** `/api/super-admin/locations`
* **Method:** `POST`
* **Auth Required:** Ya (Session Cookie, Role `SUPER_ADMIN`)
* **Headers:** `Content-Type: application/json`

### Request Body
Berisi parameter pembungkus `type` dan objek data `payload`.
```json
{
  "type": "POSKO", // Pilihan: "POSKO" atau "INVENTORY"
  "payload": {
    "name": "Posko Baru",
    "latitude": -6.1,
    "longitude": 106.5,
    "alamat": "Jl. Baru" 
  }
}
```

#### Aturan Validasi (Zod)
- **name**: Wajib, string, minimal 3 karakter.
- **latitude** & **longitude**: Wajib, angka (desimal dari peta koordinat).
- **Alamat, provinsi, dsb**: Opsional.
- Khusus **POSKO**, atribut opsional tambahan meliputi data demografis (mis. `jumlah_pengungsi`, `jumlah_dewasa`, `jumlah_anak`, `jumlah_lansia`, `jumlah_disabilitas`, `jumlah_ibu_hamil`) dan `catatan_medis_darurat`.

### Response Sukses (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "uuid-posko-baru"
  }
}
```

---

## 3. Detail Lokasi
Melihat seluruh detail data suatu Posko atau Gudang secara spesifik. Menampilkan *seluruh* daftar kebutuhan/stok (tidak dilimitasi 3) dan daftar sederhana nama relawan yang sedang bertugas di lokasi tersebut.

* **URL:** `/api/super-admin/locations/[type]/[id]`
  - `[type]` = `posko` atau `inventory`
  - `[id]` = UUID lokasi terkait
* **Method:** `GET`
* **Auth Required:** Ya (Session Cookie, Role `SUPER_ADMIN`)

### Response Sukses (Contoh Tipe: `posko`)
```json
{
  "success": true,
  "data": {
    "id": "uuid-posko-1",
    "type": "POSKO",
    "name": "Posko Pengungsian A",
    "latitude": -6.2,
    "longitude": 106.8,
    "alamat": "Jl. Merdeka No 1",
    "urgencyStatus": "MERAH",
    "urgencyScore": 85,
    "demographics": {
      "pengungsi": 50,
      "dewasa": 25,
      "anak": 15,
      "lansia": 10,
      "disabilitas": 2,
      "ibuHamil": 1
    },
    "catatanMedis": "Perlu tambahan obat diare",
    "createdAt": "2026-07-16T12:00:00Z",
    "updatedAt": "2026-07-17T12:00:00Z",
    "needs": [
      {
        "id": "need-1",
        "item_name": "Beras",
        "qty_needed": 100,
        "qty_fulfilled": 20,
        "status": "OPEN"
      },
      {
        "id": "need-2",
        "item_name": "Tenda",
        "qty_needed": 5,
        "qty_fulfilled": 5,
        "status": "FULFILLED"
      }
    ],
    "assignedVolunteers": [
      {
        "name": "Budi Santoso"
      },
      {
        "name": "Siti Aminah"
      }
    ]
  }
}
```

### Response Error Umum
- **`400 Bad Request`**: Tipe lokasi tidak valid, atau ada parameter *payload* yang tidak lolos validasi (misalnya `latitude` dikosongkan saat menambah data).
- **`403 Forbidden`**: Akun bukan *Super Admin*, atau *Super Admin* mencoba mengakses/melihat detail lokasi yang dimiliki oleh komunitas lain.
- **`404 Not Found`**: ID lokasi tidak ditemukan.

---

## 4. Contoh Payload / Cara Testing (cURL)

Anda dapat menggunakan contoh *body request* JSON di bawah ini untuk menguji pembuatan lokasi (POST) pada aplikasi *testing* API seperti Postman, Thunder Client, atau via `cURL`. Pastikan Anda sudah *login* dan memiliki cookie otentikasi sebagai `SUPER_ADMIN`.

### A. Testing Membuat Posko Baru
```bash
curl -X POST http://localhost:3000/api/super-admin/locations \
  -H "Content-Type: application/json" \
  -H "Cookie: <SESSION_COOKIE_ANDA_DISINI>" \
  -d '{
    "type": "POSKO",
    "payload": {
      "name": "Posko Bantuan Bencana Maju Jaya",
      "latitude": -6.21462,
      "longitude": 106.84513,
      "alamat": "Jl. Raya Kemerdekaan Blok C2",
      "provinsi": "DKI Jakarta",
      "jumlah_pengungsi": 120,
      "jumlah_anak": 35,
      "catatan_medis_darurat": "Banyak anak yang mulai batuk pilek"
    }
  }'
```

### B. Testing Membuat Gudang (Inventory) Baru
```bash
curl -X POST http://localhost:3000/api/super-admin/locations \
  -H "Content-Type: application/json" \
  -H "Cookie: <SESSION_COOKIE_ANDA_DISINI>" \
  -d '{
    "type": "INVENTORY",
    "payload": {
      "name": "Gudang Logistik Pusat Kemanusiaan",
      "latitude": -6.30012,
      "longitude": 106.77283,
      "alamat": "Kawasan Industri Terpadu No. 8",
      "kab_kota": "Jakarta Selatan"
    }
  }'
```
