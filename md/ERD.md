# Database Schema Documentation - TepatSalur MVP

### A. User & Access Management (Core Identities)
**Table: `users`**
* `id` (uuid, PK, FK to auth.users.id) -> Menggunakan ID bawaan Supabase Auth.
* `name`, `email`, `phone` (varchar)
* `role` (enum: UserRole) -> SUPER_ADMIN, RELAWAN, DONATUR.
* `status` (enum: UserStatus)
* `community_id` (uuid, FK to communities.id) -> Nullable.
* `avatar_url` (text), `created_at` (timestamptz)

**Table: `user_profiles`**
* `id` (uuid, PK)
* `user_id` (uuid, FK to users.id) -> Unique.
* `nama_lengkap`, `alamat` (varchar/text)
* `nik` (varchar) -> Unique. Hanya diisi untuk relawan.
* `tempat_lahir`, `tanggal_lahir`, `jenis_kelamin` (varchar/date/enum)
* `is_completed` (boolean) -> Penanda apakah profil sudah diisi lengkap.
* `created_at`, `updated_at` (timestamptz)

### B. Organization & Facilities (The Hubs)
**Table: `communities`**
* `id` (uuid, PK)
* `name` (varchar)
* `super_admin_id` (uuid, FK to users.id) -> Unique. Pembuat komunitas.
* `description` (text), `created_at` (timestamptz)

**Table: `inventory_locations`**
* `id` (uuid, PK)
* `community_id` (uuid, FK to communities.id)
* `name` (varchar)
* `latitude`, `longitude` (double) -> Wajib, titik presisi dari GPS/Map.
* `alamat`, `provinsi`, `kab_kota`, `kecamatan` (text/varchar) -> Opsional, input manual/geocoding.
* `foto_url` (text), `is_active` (boolean)
* `created_at` (timestamptz)

**Table: `posko`**
* `id` (uuid, PK)
* `community_id` (uuid, FK to communities.id)
* `name` (varchar)
* `latitude`, `longitude` (double) -> Wajib, titik presisi dari GPS/Map.
* `alamat`, `provinsi`, `kab_kota`, `kecamatan` (text/varchar) -> Opsional.
* `jumlah_pengungsi`, `jumlah_dewasa`, `jumlah_anak`, `jumlah_lansia`, `jumlah_disabilitas`, `jumlah_ibu_hamil` (int) -> Metrik triase.
* `catatan_medis_darurat` (text)
* `ai_status` (enum: UrgencyStatus) -> HIJAU, KUNING, MERAH hasil kalkulasi AI.
* `ai_urgency_score` (int) -> Skor 0-100 untuk *sorting* prioritas.
* `last_ai_update`, `created_at`, `updated_at` (timestamptz)

### C. Volunteer Assignments (Workforce Allocation)
**Table: `relawan_assignments`**
* `id` (uuid, PK)
* `user_id` (uuid, FK to users.id) -> Diindeks unik parsial agar relawan hanya punya 1 tugas aktif.
* `community_id` (uuid, FK to communities.id)
* `assignment_type` (enum: AssignmentType) -> POSKO atau INVENTORY.
* `inventory_location_id` (uuid, FK to inventory_locations.id) -> Nullable, dicegah *overlap* dengan `posko_id` menggunakan *check constraint*.
* `posko_id` (uuid, FK to posko.id) -> Nullable.
* `status` (enum: AssignmentStatus)
* `is_active` (boolean)
* `assigned_at`, `deactivated_at`, `created_at` (timestamptz)

### D. Needs & Supply Management (The Inventory)
**Table: `posko_kebutuhan`**
* `id` (uuid, PK)
* `posko_id` (uuid, FK to posko.id)
* `item_name` (varchar)
* `category_kebutuhan` (enum: KebutuhanCategory)
* `qty_needed` (int)
* `qty_booked` (int) -> Terkunci otomatis via RPC saat relawan *accept* tugas.
* `qty_fulfilled` (int) -> Bertambah setelah barang *DELIVERED*.
* `status` (enum: ItemStatus) -> OPEN, PARTIALLY_BOOKED, FULLY_BOOKED, FULFILLED.
* `created_at` (timestamptz)

**Table: `donasi`**
* `id` (uuid, PK)
* `donatur_id` (uuid, FK to users.id)
* `item_name`, `category` (varchar/enum)
* `qty_donated` (int)
* `latitude`, `longitude` (double) -> Titik jemput barang.
* `alamat_pickup` (text)
* `recommended_inventory_id` (uuid, FK to inventory_locations.id) -> Target gudang yang direkomendasikan sistem.
* `accepted_by_inventory_id` (uuid, FK) -> Gudang yang akhirnya menerima donasi.
* `status` (enum: DonasiStatus)
* `created_at`, `updated_at` (timestamptz)

**Table: `inventory_items`**
* `id` (uuid, PK)
* `inventory_location_id` (uuid, FK to inventory_locations.id)
* `item_name`, `category` (varchar/enum)
* `qty_available` (int)
* `qty_booked` (int) -> Dikunci saat barang sedang dalam perjalanan ke posko.
* `source_donasi_id` (uuid, FK to donasi.id) -> *Tracking* asal usul barang.
* `created_at` (timestamptz)

### E. Distribution Mapping (The Matchmaker)
**Table: `distribusi`**
* `id` (uuid, PK)
* `inventory_location_id` (uuid, FK to inventory_locations.id) -> Gudang asal.
* `posko_id` (uuid, FK to posko.id) -> Posko tujuan.
* `relawan_id` (uuid, FK to users.id) -> Kurir pengantar.
* `status` (enum: TaskStatus) -> PENDING, ACCEPTED, EN_ROUTE, DELIVERED.
* `ai_recommendation_score` (int) -> Skor seberapa cocok tugas ini untuk relawan tsb.
* `catatan` (text)
* `created_at`, `completed_at` (timestamptz)

**Table: `distribusi_items`**
* `id` (uuid, PK)
* `distribusi_id` (uuid, FK to distribusi.id)
* `inventory_item_id` (uuid, FK to inventory_items.id) -> Referensi fisik barang dari gudang.
* `kebutuhan_id` (uuid, FK to posko_kebutuhan.id) -> Referensi untuk *update* `qty_fulfilled` di posko.
* `qty_allocated` (int) -> Jumlah yang dibawa kurir.
* `created_at` (timestamptz)

### F. AI Audit Trail
**Table: `ai_log`**
* `id` (uuid, PK)
* `type` (enum: AiLogType)
* `posko_id`, `donasi_id`, `distribusi_id` (uuid, FK) -> Konteks fitur (nullable).
* `raw_input` (text) -> Raw text from Speech-to-Text or manual form input.
* `ai_response_json` (jsonb) -> Raw JSON response from Gemini API for debugging and demo purposes.
* `created_at` (timestamptz)