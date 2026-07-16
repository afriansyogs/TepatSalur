export type UserRole = "SUPER_ADMIN" | "RELAWAN" | "DONATUR";

export type UserStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export type Gender = "L" | "P";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  communityId: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  namaLengkap: string;
  alamat: string;
  nik: string | null;
  tempatLahir: string | null;
  tanggalLahir: string | null;
  jenisKelamin: Gender | null;
  alamatKtp: string | null;
  fotoKtpUrl: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Community {
  id: string;
  name: string;
  superAdminId: string;
  description: string | null;
  createdAt: string;
}
