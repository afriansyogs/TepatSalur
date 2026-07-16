import { z } from "zod";

export const relawanOnboardingSchema = z.object({
  nik: z
    .string()
    .length(16, "NIK harus 16 digit")
    .regex(/^[0-9]+$/, "NIK hanya boleh berisi angka"),
  tempatLahir: z.string().min(1, "Tempat lahir wajib diisi"),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  jenisKelamin: z.enum(["L", "P"], { message: "Pilih jenis kelamin" }),
  alamat: z.string().min(5, "Alamat wajib diisi"),
  communityId: z.string().uuid("Pilih komunitas"),
});

export const adminProfileSchema = z.object({
  nik: z
    .string()
    .length(16, "NIK harus 16 digit")
    .regex(/^[0-9]+$/, "NIK hanya boleh berisi angka"),
  tempatLahir: z.string().min(1, "Tempat lahir wajib diisi"),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
  jenisKelamin: z.enum(["L", "P"], { message: "Pilih jenis kelamin" }),
  alamat: z.string().min(5, "Alamat wajib diisi"),
});

export const adminCommunitySchema = z.object({
  name: z.string().min(3, "Nama komunitas minimal 3 karakter"),
  description: z.string().optional(),
});

export const adminInventorySchema = z.object({
  name: z.string().min(3, "Nama gudang minimal 3 karakter"),
  latitude: z.number({ message: "Latitude wajib diisi" }),
  longitude: z.number({ message: "Longitude wajib diisi" }),
  provinsi: z.string().optional(),
  kabKota: z.string().optional(),
  kecamatan: z.string().optional(),
  fotoUrl: z.string().url("Format URL foto tidak valid").optional().or(z.literal("")),
});

export const adminOnboardingSchema = adminProfileSchema
  .merge(adminCommunitySchema)
  .merge(adminInventorySchema);

export type RelawanOnboardingValues = z.infer<typeof relawanOnboardingSchema>;
export type AdminProfileValues = z.infer<typeof adminProfileSchema>;
export type AdminCommunityValues = z.infer<typeof adminCommunitySchema>;
export type AdminInventoryValues = z.infer<typeof adminInventorySchema>;
export type AdminOnboardingValues = z.infer<typeof adminOnboardingSchema>;
