# Dokumentasi API Distribusi Logistik (AI-Powered)

API ini digunakan oleh `RELAWAN` dengan assignment aktif di Gudang (Inventory) untuk mendapatkan rekomendasi distribusi bantuan berbasis AI dan mengeksekusi booking secara atomik.

---

## 1. Rekomendasi Distribusi AI

Menganalisis stok gudang dan kebutuhan semua posko dalam komunitas, lalu menghasilkan rekomendasi alokasi optimal berbasis urgency score posko.

* **URL:** `/api/ai/distribution`
* **Method:** `POST`
* **Auth Required:** Ya (Session Cookie, Role `RELAWAN`, assignment type `INVENTORY`, status `APPROVED`, `is_active: true`)
* **Headers:** `Content-Type: application/json`

### Request Body
```json
{
  "inventoryLocationId": "uuid-gudang"
}
```

#### Aturan Validasi
- **inventoryLocationId**: Wajib, UUID gudang yang menjadi tugas aktif relawan tersebut.

### Response Sukses (`200 OK`)
```json
{
  "success": true,
  "data": [
    {
      "poskoId": "uuid-posko-a",
      "poskoName": "Posko Pengungsian A",
      "aiStatus": "MERAH",
      "aiUrgencyScore": 85,
      "reasoning": "Posko A memiliki urgensi tertinggi. Dialokasikan 40 unit dari total 60 stok karena Posko B juga membutuhkan dan berisiko naik ke MERAH jika diabaikan.",
      "items": [
        {
          "inventoryItemId": "uuid-inv-item-1",
          "kebutuhanId": "uuid-kebutuhan-1",
          "itemName": "Beras 5kg",
          "category": "MAKANAN",
          "qtyAllocated": 40
        }
      ]
    },
    {
      "poskoId": "uuid-posko-b",
      "poskoName": "Posko Pengungsian B",
      "aiStatus": "KUNING",
      "aiUrgencyScore": 55,
      "reasoning": "Posko B dialokasikan 20 unit sisa stok untuk mencegah eskalasi status ke MERAH.",
      "items": [
        {
          "inventoryItemId": "uuid-inv-item-1",
          "kebutuhanId": "uuid-kebutuhan-2",
          "itemName": "Beras 5kg",
          "category": "MAKANAN",
          "qtyAllocated": 20
        }
      ]
    }
  ]
}
```

#### Logika Alokasi AI
- Posko dengan `aiUrgencyScore` tertinggi (MERAH > KUNING > HIJAU) mendapat prioritas utama.
- Stok tidak dialokasikan penuh ke 1 posko jika berpotensi membuat posko lain eskalasi ke MERAH — dibagi proporsional.
- Hanya posko dengan alokasi > 0 yang dikembalikan.
- Match item berdasarkan `category` yang sama antara stok gudang dan kebutuhan posko.
- Rekomendasi **tidak otomatis melakukan booking** — relawan harus eksekusi via endpoint accept.

### Response Error
- **`400 Bad Request`**: `inventoryLocationId` tidak diisi, tidak ada stok tersedia, atau tidak ada posko dengan kebutuhan aktif.
- **`403 Forbidden`**: Relawan tidak memiliki assignment aktif di gudang tersebut.
- **`500 Internal Server Error`**: Gagal memproses respons AI.

---

## 2. Accept Rekomendasi Distribusi (Atomic Booking)

Mengeksekusi rekomendasi distribusi untuk **1 posko** secara atomik: membuat record `distribusi` + `distribusi_items` dan mengunci `qty_booked` di `inventory_items` dan `posko_kebutuhan` dalam 1 transaksi PostgreSQL (via RPC `accept_distribusi`). Mencegah race condition saat multiple relawan accept bersamaan.

* **URL:** `/api/distribusi/accept`
* **Method:** `POST`
* **Auth Required:** Ya (Session Cookie, Role `RELAWAN`, assignment type `INVENTORY`, status `APPROVED`, `is_active: true`)
* **Headers:** `Content-Type: application/json`

### Request Body
Gunakan data `items` dari response endpoint rekomendasi di atas, satu objek posko per request.
```json
{
  "inventoryLocationId": "uuid-gudang",
  "poskoId": "uuid-posko-a",
  "items": [
    {
      "inventoryItemId": "uuid-inv-item-1",
      "kebutuhanId": "uuid-kebutuhan-1",
      "qtyAllocated": 40
    }
  ]
}
```

#### Aturan Validasi (Zod)
- **inventoryLocationId**: Wajib, UUID.
- **poskoId**: Wajib, UUID.
- **items**: Wajib, array minimal 1 item.
  - **inventoryItemId**: Wajib, UUID referensi `inventory_items.id`.
  - **kebutuhanId**: Wajib, UUID referensi `posko_kebutuhan.id`.
  - **qtyAllocated**: Wajib, integer minimal 1.

### Response Sukses (`200 OK`)
```json
{
  "success": true,
  "data": {
    "distribusiId": "uuid-distribusi-baru"
  }
}
```

#### Yang Terjadi di Database (Atomic via RPC)
1. `INSERT` ke tabel `distribusi` dengan status `PENDING`.
2. Untuk setiap item: `INSERT` ke `distribusi_items`.
3. `UPDATE inventory_items SET qty_booked += qtyAllocated` (dengan `SELECT FOR UPDATE`).
4. `UPDATE posko_kebutuhan SET qty_booked += qtyAllocated, status = ...` (dengan `SELECT FOR UPDATE`).
5. Status `posko_kebutuhan` otomatis berubah: `OPEN` → `PARTIALLY_BOOKED` atau `FULLY_BOOKED`.
6. Seluruh operasi di-`ROLLBACK` otomatis jika stok tidak mencukupi atau qty melebihi kebutuhan.

### Response Error
- **`400 Bad Request`**: Body tidak lolos validasi Zod.
- **`403 Forbidden`**: Relawan tidak memiliki assignment aktif di gudang tersebut.
- **`500 Internal Server Error`**: Stok tidak mencukupi, alokasi melebihi kebutuhan, atau error DB lainnya. Pesan error dari RPC diteruskan langsung.

---

## 3. Alur Lengkap (Happy Path)

```
Relawan Inventory
      │
      ├─ 1. POST /api/ai/distribution
      │      { inventoryLocationId }
      │      → Dapat array rekomendasi per posko
      │
      ├─ 2. Tampilkan card rekomendasi ke relawan
      │      Relawan review reasoning + items per posko
      │
      ├─ 3a. Accept → POST /api/distribusi/accept
      │       { inventoryLocationId, poskoId, items[] }
      │       → qty_booked terkunci atomik
      │       → distribusiId dikembalikan
      │
      └─ 3b. Reject → dismiss di UI, tidak ada API call
```

---

## 4. Contoh Testing (cURL)

### A. Mendapatkan Rekomendasi AI
```bash
curl -X POST http://localhost:3000/api/ai/distribution \
  -H "Content-Type: application/json" \
  -H "Cookie: <SESSION_COOKIE_ANDA_DISINI>" \
  -d '{
    "inventoryLocationId": "uuid-gudang-anda"
  }'
```

### B. Accept Rekomendasi untuk 1 Posko
```bash
curl -X POST http://localhost:3000/api/distribusi/accept \
  -H "Content-Type: application/json" \
  -H "Cookie: <SESSION_COOKIE_ANDA_DISINI>" \
  -d '{
    "inventoryLocationId": "uuid-gudang-anda",
    "poskoId": "uuid-posko-a",
    "items": [
      {
        "inventoryItemId": "uuid-inv-item-1",
        "kebutuhanId": "uuid-kebutuhan-1",
        "qtyAllocated": 40
      }
    ]
  }'
```

---

## 5. Prasyarat Database

Sebelum endpoint accept dapat digunakan, jalankan SQL berikut di Supabase SQL Editor:

```sql
-- Tambah enum value jika belum ada
ALTER TYPE "AiLogType" ADD VALUE IF NOT EXISTS 'DISTRIBUTION_RECOMMENDATION';

-- Buat RPC untuk atomic booking
CREATE OR REPLACE FUNCTION accept_distribusi(
  p_inventory_location_id uuid,
  p_posko_id              uuid,
  p_relawan_id            uuid,
  p_items                 jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_distribusi_id  uuid;
  v_item           jsonb;
  v_inv_item_id    uuid;
  v_kebutuhan_id   uuid;
  v_qty_allocated   int;
  v_qty_available   int;
  v_qty_booked_inv  int;
  v_qty_needed      int;
  v_qty_booked_keb  int;
  v_new_status      text;
BEGIN
  INSERT INTO distribusi (inventory_location_id, posko_id, relawan_id, status, created_at)
  VALUES (p_inventory_location_id, p_posko_id, p_relawan_id, 'PENDING', now())
  RETURNING id INTO v_distribusi_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_inv_item_id   := (v_item->>'inventoryItemId')::uuid;
    v_kebutuhan_id  := (v_item->>'kebutuhanId')::uuid;
    v_qty_allocated := (v_item->>'qtyAllocated')::int;

    SELECT qty_available, qty_booked INTO v_qty_available, v_qty_booked_inv
    FROM inventory_items WHERE id = v_inv_item_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Inventory item % tidak ditemukan', v_inv_item_id;
    END IF;
    IF (v_qty_available - v_qty_booked_inv) < v_qty_allocated THEN
      RAISE EXCEPTION 'Stok tidak mencukupi untuk item %', v_inv_item_id;
    END IF;

    SELECT qty_needed, qty_booked INTO v_qty_needed, v_qty_booked_keb
    FROM posko_kebutuhan WHERE id = v_kebutuhan_id FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Kebutuhan % tidak ditemukan', v_kebutuhan_id;
    END IF;
    IF (v_qty_needed - v_qty_booked_keb) < v_qty_allocated THEN
      RAISE EXCEPTION 'Alokasi melebihi kebutuhan untuk item %', v_kebutuhan_id;
    END IF;

    INSERT INTO distribusi_items (distribusi_id, inventory_item_id, kebutuhan_id, qty_allocated, created_at)
    VALUES (v_distribusi_id, v_inv_item_id, v_kebutuhan_id, v_qty_allocated, now());

    UPDATE inventory_items
    SET qty_booked = qty_booked + v_qty_allocated
    WHERE id = v_inv_item_id;

    v_new_status := CASE
      WHEN (v_qty_booked_keb + v_qty_allocated) >= v_qty_needed THEN 'FULLY_BOOKED'
      WHEN (v_qty_booked_keb + v_qty_allocated) > 0             THEN 'PARTIALLY_BOOKED'
      ELSE 'OPEN'
    END;

    UPDATE posko_kebutuhan
    SET qty_booked = qty_booked + v_qty_allocated,
        status     = v_new_status
    WHERE id = v_kebutuhan_id;
  END LOOP;

  RETURN v_distribusi_id;
END;
$$;
```
