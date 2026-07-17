# Dokumentasi API Map & Stats

API publik (tidak perlu auth) untuk data peta dan statistik dashboard.

---

## 1. Stats Dashboard

Mengambil angka ringkasan untuk ditampilkan di dashboard.

* **URL:** `/api/stats`
* **Method:** `GET`
* **Auth Required:** Tidak

### Response Sukses (`200 OK`)
```json
{
  "success": true,
  "data": {
    "totalPengungsi": 430,
    "totalPoskoMerah": 3,
    "totalRelawanAktif": 12
  }
}
```

---

## 2. Data Peta (List)

Mengambil semua lokasi (posko dan/atau inventory) dengan koordinat untuk ditampilkan di peta.

* **URL:** `/api/map`
* **Method:** `GET`
* **Auth Required:** Tidak
* **Query Params:**

| Param | Nilai | Default | Keterangan |
|---|---|---|---|
| `filter` | `all` \| `posko` \| `inventory` | `all` | Filter tipe lokasi |

### Response Sukses (`200 OK`)
```json
{
  "success": true,
  "data": {
    "posko": [
      {
        "id": "uuid",
        "type": "POSKO",
        "name": "Posko A",
        "latitude": -6.18,
        "longitude": 106.83,
        "aiStatus": "MERAH",
        "aiUrgencyScore": 85,
        "jumlahPengungsi": 150,
        "alamat": "Jl. Merdeka No. 1",
        "kabKota": "Jakarta Timur",
        "provinsi": "DKI Jakarta",
        "totalRelawan": 3,
        "kebutuhan": [
          { "id": "uuid", "itemName": "Beras 5kg", "category": "MAKANAN", "qtyNeeded": 100, "qtyFulfilled": 20, "status": "OPEN" }
        ]
      }
    ],
    "inventory": [
      {
        "id": "uuid",
        "type": "INVENTORY",
        "name": "Gudang Pusat",
        "latitude": -6.30,
        "longitude": 106.77,
        "isActive": true,
        "alamat": "Jl. Gudang No. 5",
        "kabKota": "Jakarta Selatan",
        "provinsi": "DKI Jakarta",
        "totalRelawan": 2,
        "items": [
          { "id": "uuid", "itemName": "Beras 5kg", "category": "MAKANAN", "qtyAvailable": 60, "qtyBooked": 10 }
        ]
      }
    ]
  }
}
```

#### Catatan
- `kebutuhan` hanya berisi max 3 item yang belum `FULFILLED`.
- `items` hanya berisi max 3 item stok teratas.
- Filter `posko` → field `inventory` array kosong `[]`. Filter `inventory` → field `posko` array kosong `[]`.

---

## 3. Detail Posko

Mengambil detail lengkap satu posko termasuk demografi, kondisi medis, semua kebutuhan, dan relawan aktif.

* **URL:** `/api/map/posko/[id]`
* **Method:** `GET`
* **Auth Required:** Tidak

### Response Sukses (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Posko A",
    "latitude": -6.18,
    "longitude": 106.83,
    "alamat": "Jl. Merdeka No. 1",
    "kabKota": "Jakarta Timur",
    "provinsi": "DKI Jakarta",
    "kecamatan": "Kramat Jati",
    "aiStatus": "MERAH",
    "aiUrgencyScore": 85,
    "jumlahPengungsi": 150,
    "jumlahDewasa": 80,
    "jumlahAnak": 40,
    "jumlahLansia": 20,
    "jumlahDisabilitas": 5,
    "jumlahIbuHamil": 5,
    "catatanMedisDarurat": "Banyak anak batuk pilek, 2 lansia butuh obat hipertensi",
    "kebutuhan": [
      {
        "id": "uuid",
        "itemName": "Beras 5kg",
        "category": "MAKANAN",
        "qtyNeeded": 100,
        "qtyBooked": 40,
        "qtyFulfilled": 20,
        "status": "PARTIALLY_BOOKED"
      }
    ],
    "relawan": [
      { "name": "Budi Santoso" },
      { "name": "Siti Aminah" }
    ]
  }
}
```

### Response Error
- **`404 Not Found`**: ID posko tidak ditemukan.

---

## 4. Detail Inventory

Mengambil detail lengkap satu gudang termasuk seluruh stok dan relawan aktif.

* **URL:** `/api/map/inventory/[id]`
* **Method:** `GET`
* **Auth Required:** Tidak

### Response Sukses (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Gudang Pusat",
    "latitude": -6.30,
    "longitude": 106.77,
    "alamat": "Jl. Gudang No. 5",
    "kabKota": "Jakarta Selatan",
    "provinsi": "DKI Jakarta",
    "kecamatan": "Kebayoran Baru",
    "isActive": true,
    "items": [
      {
        "id": "uuid",
        "itemName": "Beras 5kg",
        "category": "MAKANAN",
        "qtyAvailable": 60,
        "qtyBooked": 10
      }
    ],
    "relawan": [
      { "name": "Ahmad Fauzi" }
    ]
  }
}
```

### Response Error
- **`404 Not Found`**: ID inventory tidak ditemukan.

---

## 5. Contoh Testing (cURL)

```bash
# Stats
curl http://localhost:3000/api/stats

# Map semua lokasi
curl http://localhost:3000/api/map

# Hanya posko
curl "http://localhost:3000/api/map?filter=posko"

# Hanya inventory
curl "http://localhost:3000/api/map?filter=inventory"

# Detail posko
curl http://localhost:3000/api/map/posko/<UUID_POSKO>

# Detail inventory
curl http://localhost:3000/api/map/inventory/<UUID_INVENTORY>
```
