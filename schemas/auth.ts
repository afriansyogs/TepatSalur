import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email salah"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const signUpSchema = z.object({
  name: z.string().min(3, "Nama lengkap minimal 3 karakter"),
  email: z.string().min(1, "Email wajib diisi").email("Format email salah"),
  phone: z
    .string()
    .min(9, "Nomor telepon minimal 9 digit")
    .regex(/^[0-9+]+$/, "Format nomor telepon tidak valid"),
  role: z.enum(["SUPER_ADMIN", "RELAWAN", "DONATUR"], {
    message: "Pilih peran Anda",
  }),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email wajib diisi").email("Format email salah"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
