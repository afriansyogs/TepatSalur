# Dokumentasi API Manajemen Inventory

API untuk relawan dengan assignment aktif tipe `INVENTORY`. Semua endpoint memerlukan auth session cookie.

---

## 1. Stats Dashboard

* **URL:** `/api/stats`
* **Method:** `GET`
* **Auth Required:** Tidak (public)

### Response Sukses (`200 OK`)
```json
{
  "success": true,
  "data": {
    "totalPengungsi": 430,
    "totalPoskoMerah": 3,
    "totalRelawanAktif": 12,
    "totalDonasiPending": 8,
    "totalDonasiDelivery": 3,
    "totalInventoryItems": 245
  }
}
```

---

## 2. List Donasi Masuk

Donasi yang direkomendasikan ke gudang relawan dengan status `PENDING` atau `DELIVERY`.

* **URL:** `/api/relawan/inventory/donasi`
* **Method:** `GET`
* **Auth Required:** Ya (INVENTORY assignment aktif)

### Response Sukses (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "itemName": "Beras 5kg",
      "category": "MAKANAN",
      "qtyDonated": 10,
      "latitude": -6.21,
      "longitude": 106.84,
      "alamatPickup": "Jl. Donatur No. 1",
      "status": "PENDING",
      "createdAt": "2026-07-17T00:00:00Z",
      "updatedAt": "2026-07-17T00:00:00Z",
      "donatur": {
        "id": "uuid",
        "name": "Budi Santoso",
        "email": "budi@mail.com",
        "phone": "08123456789"
      }
    }
  ]
}
```

---

## 3. Accept Donasi (PENDING → DELIVERY)

Tandai donasi sedang dijemput/diantar.

* **URL:** `/api/relawan/inventory/donasi/[id]/accept`
* **Method:** `POST`
* **Auth Required:** Ya

### Response Sukses (`200 OK`)
```json
{ "success": true, "data": { "id": "uuid", "status": "DELIVERY" } }
```

### Error
- `400` — status donasi bukan `PENDING`
- `404` — donasi tidak ditemukan di gudang ini

---

## 4. Konfirmasi Tiba (DELIVERY → ACCEPTED + stok masuk)

Konfirmasi barang sudah tiba di gudang. Otomatis INSERT ke `inventory_items`.

* **URL:** `/api/relawan/inventory/donasi/[id]/confirm`
* **Method:** `POST`
* **Auth Required:** Ya

### Response Sukses (`200 OK`)
```json
{ "success": true, "data": { "id": "uuid", "status": "ACCEPTED" } }
```

### Error
- `400` — status donasi bukan `DELIVERY`
- `404` — donasi tidak ditemukan di gudang ini

---

## 5. Tolak Donasi (→ REJECTED)

Tolak donasi selama belum `ACCEPTED`.

* **URL:** `/api/relawan/inventory/donasi/[id]/reject`
* **Method:** `POST`
* **Auth Required:** Ya

### Response Sukses (`200 OK`)
```json
{ "success": true, "data": { "id": "uuid", "status": "REJECTED" } }
```

### Error
- `400` — donasi sudah `ACCEPTED`, tidak bisa ditolak

---

## 6. Tambah Stok Manual

Tambah item stok tanpa donasi (`source_donasi_id = null`).

* **URL:** `/api/relawan/inventory/items`
* **Method:** `POST`
* **Auth Required:** Ya

### Request Body
```json
{
  "itemName": "Selimut",
  "category": "PAKAIAN",
  "qtyAvailable": 20
}
```

#### Validasi
- `itemName`: wajib, min 1 karakter
- `category`: `MAKANAN` | `PAKAIAN` | `OBAT` | `LAINNYA`
- `qtyAvailable`: integer, min 1

### Response Sukses (`201 Created`)
```json
{ "success": true, "data": { "id": "uuid-item-baru" } }
```

---

## 7. Edit Stok

* **URL:** `/api/relawan/inventory/items/[id]`
* **Method:** `PATCH`
* **Auth Required:** Ya

### Request Body (semua opsional, min 1 field)
```json
{
  "itemName": "Selimut Tebal",
  "category": "PAKAIAN",
  "qtyAvailable": 25
}
```

#### Guard
- `qtyAvailable` tidak boleh kurang dari `qty_booked` item tersebut.

### Response Sukses (`200 OK`)
```json
{ "success": true, "data": { "id": "uuid" } }
```

---

## 8. Hapus Stok

* **URL:** `/api/relawan/inventory/items/[id]`
* **Method:** `DELETE`
* **Auth Required:** Ya

### Response Sukses (`200 OK`)
```json
{ "success": true, "data": { "id": "uuid" } }
```

### Error
- `400` — item sedang dalam proses distribusi (`qty_booked > 0`)
- `404` — item tidak ditemukan di gudang ini

---

## 9. Flow Lengkap Donasi → Stok

```
Donatur submit donasi
      ↓
GET /api/relawan/inventory/donasi  (status = PENDING)
      ↓
Relawan klik "Terima" → POST .../accept   (PENDING → DELIVERY)
      ↓
Barang tiba di gudang
      ↓
Relawan klik "Konfirmasi Tiba" → POST .../confirm  (DELIVERY → ACCEPTED)
      → AUTO INSERT inventory_items
      ↓
Stok tersedia di gudang untuk distribusi AI
```

---

## 10. Contoh cURL

```bash
# List donasi masuk
curl http://localhost:3000/api/relawan/inventory/donasi \
  -H "Cookie: <SESSION_COOKIE>"

# Accept donasi
curl -X POST http://localhost:3000/api/relawan/inventory/donasi/<ID>/accept \
  -H "Cookie: <SESSION_COOKIE>"

# Konfirmasi tiba
curl -X POST http://localhost:3000/api/relawan/inventory/donasi/<ID>/confirm \
  -H "Cookie: <SESSION_COOKIE>"

# Tolak donasi
curl -X POST http://localhost:3000/api/relawan/inventory/donasi/<ID>/reject \
  -H "Cookie: <SESSION_COOKIE>"

# Tambah stok manual
curl -X POST http://localhost:3000/api/relawan/inventory/items \
  -H "Content-Type: application/json" \
  -H "Cookie: <SESSION_COOKIE>" \
  -d '{"itemName":"Selimut","category":"PAKAIAN","qtyAvailable":20}'

# Edit stok
curl -X PATCH http://localhost:3000/api/relawan/inventory/items/<ID> \
  -H "Content-Type: application/json" \
  -H "Cookie: <SESSION_COOKIE>" \
  -d '{"qtyAvailable":30}'

# Hapus stok
curl -X DELETE http://localhost:3000/api/relawan/inventory/items/<ID> \
  -H "Cookie: <SESSION_COOKIE>"
```

---

## 11. SQL — Migrasi Enum DonasiStatus

Jalankan di Supabase SQL Editor sebelum menggunakan API ini:

```sql
-- Rename existing values
ALTER TYPE "DonasiStatus" RENAME VALUE 'submited' TO 'PENDING';
ALTER TYPE "DonasiStatus" RENAME VALUE 'pickeup' TO 'DELIVERY';
ALTER TYPE "DonasiStatus" RENAME VALUE 'accepted' TO 'ACCEPTED';
ALTER TYPE "DonasiStatus" RENAME VALUE 'canceled' TO 'REJECTED';

-- PG 16+: drop ai_recomended
ALTER TYPE "DonasiStatus" DROP VALUE 'ai_recomended';

-- PG < 16: buat ulang enum
ALTER TABLE donasi ALTER COLUMN status DROP DEFAULT;
CREATE TYPE "DonasiStatus_new" AS ENUM ('PENDING', 'DELIVERY', 'ACCEPTED', 'REJECTED');
ALTER TABLE donasi ALTER COLUMN status TYPE "DonasiStatus_new" USING status::text::"DonasiStatus_new";
DROP TYPE "DonasiStatus";
ALTER TYPE "DonasiStatus_new" RENAME TO "DonasiStatus";
```
