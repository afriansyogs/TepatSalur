# Dokumentasi API Manajemen Anggota (Super Admin)

API ini disediakan khusus untuk pengguna dengan peran `SUPER_ADMIN` untuk mengelola status dan penugasan relawan (`RELAWAN`) dalam komunitas mereka.

---

## 1. Daftar dan Pencarian Anggota

Mengambil daftar relawan dalam komunitas admin, mendukung pencarian kata kunci dan filter tipe penugasan atau status pengguna.

* **URL:** `/api/super-admin/members`
* **Method:** `GET`
* **Auth Required:** Ya (Session Cookie, Role `SUPER_ADMIN`)
* **Headers:** `Content-Type: application/json`

### Query Parameters

| Parameter | Tipe | Wajib | Keterangan |
| :--- | :--- | :--- | :--- |
| `search` | `string` | Tidak | Pencarian kata kunci (nama, email, nomor telepon, atau nama lengkap profile). Case-insensitive. |
| `assignment_type` | `string` | Tidak | Filter tipe penugasan. Pilihan: `POSKO`, `INVENTORY`, `UNASSIGNED`. |
| `status` | `string` | Tidak | Filter status relawan. Pilihan: `PENDING`, `ACTIVE`, `SUSPENDED`. |

### Response Sukses (`200 OK`)

```json
{
  "success": true,
  "data": [
    {
      "id": "c3a2f8b1-4c4d-4e4f-8f8f-9a9b9c9d9e9f",
      "name": "Budi Santoso",
      "email": "budi@mail.com",
      "phone": "081234567890",
      "status": "ACTIVE",
      "createdAt": "2026-07-16T12:00:00.000Z",
      "profile": {
        "namaLengkap": "Budi Santoso",
        "alamat": "Jl. Kemerdekaan No. 10",
        "nik": "3201020304050607",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1995-05-15",
        "jenisKelamin": "L"
      },
      "assignment": {
        "id": "e5f6g7h8-1a2b-3c4d-5e6f-7g8h9i0j1k2l",
        "assignmentType": "POSKO",
        "status": "APPROVED",
        "assignedAt": "2026-07-17T00:00:00.000Z",
        "location": {
          "id": "a1b2c3d4-e5f6-7a8b-9c10-111213141516",
          "name": "Posko SD Negeri 01"
        }
      }
    }
  ],
  "metadata": {
    "poskos": [
      {
        "id": "a1b2c3d4-e5f6-7a8b-9c10-111213141516",
        "name": "Posko SD Negeri 01"
      }
    ],
    "inventories": [
      {
        "id": "g9h8i7j6-k5l4-m3n2-o1p0-q9r8s7t6u5v4",
        "name": "Gudang Utama Sentul"
      }
    ]
  }
}
```

---

## 2. Perbarui Status dan Penugasan Anggota

Memperbarui status pendaftaran relawan atau menugaskannya ke lokasi tertentu (Posko atau Gudang).

* **URL:** `/api/super-admin/members/[memberId]`
* **Method:** `PATCH`
* **Auth Required:** Ya (Session Cookie, Role `SUPER_ADMIN`)
* **Headers:** `Content-Type: application/json`

### Path Parameters

* `memberId` (UUID): ID dari pengguna (relawan) yang ingin dikelola.

### Request Body (JSON)

Semua bidang bersifat opsional, tetapi validasi khusus berlaku ketika penugasan diperbarui.

| Field | Tipe | Keterangan |
| :--- | :--- | :--- |
| `status` | `string` | Status relawan baru. Pilihan: `PENDING`, `ACTIVE`, `SUSPENDED`. |
| `assignmentType` | `string` | Tipe penugasan baru. Pilihan: `POSKO`, `INVENTORY`, `UNASSIGNED`. |
| `poskoId` | `string` | UUID Posko. **Wajib** diisi jika `assignmentType` adalah `POSKO`. |
| `inventoryLocationId` | `string` | UUID Gudang. **Wajib** diisi jika `assignmentType` adalah `INVENTORY`. |

#### Aturan Bisnis & Validasi (Zod):
1. Pengguna yang diedit harus memiliki peran `RELAWAN` dan terdaftar di bawah `community_id` yang sama dengan `SUPER_ADMIN` yang masuk.
2. Jika `assignmentType` diubah menjadi `POSKO` atau `INVENTORY`, tugas aktif sebelumnya untuk relawan tersebut akan otomatis dinonaktifkan (`is_active = false`, `deactivated_at = saat_ini`) sebelum tugas baru dibuat dengan status `APPROVED`.
3. Jika `assignmentType` diset ke `UNASSIGNED`, tugas aktif sebelumnya akan dinonaktifkan tanpa membuat penugasan baru.

### Response Sukses (`200 OK`)

```json
{
  "success": true
}
```

### Response Error Umum

#### `400 Bad Request` (Validasi Gagal)
```json
{
  "success": false,
  "error": "ID lokasi harus ditentukan sesuai dengan tipe penugasan"
}
```

#### `401 Unauthorized` (Sesi Kadaluarsa/Belum Login)
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

#### `403 Forbidden` (Bukan Super Admin atau Beda Komunitas)
```json
{
  "success": false,
  "error": "Akses ditolak: Anggota berada di luar komunitas Anda"
}
```

#### `404 Not Found` (Relawan Tidak Ditemukan)
```json
{
  "success": false,
  "error": "Anggota tidak ditemukan"
}
```
