"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Heart, Users, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, SignUpFormValues } from "@/schemas/auth";
import { authService } from "@/services/auth.service";
import { ToastContainer, useToast } from "@/components/ui/toast";
import type { UserRole } from "@/types/auth";

type RoleKey = "relawan" | "donatur" | "super_admin";

const roleConfig: Record<
  RoleKey,
  {
    label: string;
    formRole: UserRole;
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
  }
> = {
  relawan: {
    label: "Relawan",
    formRole: "RELAWAN",
    icon: <Users className="w-4 h-4" />,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  donatur: {
    label: "Donatur",
    formRole: "DONATUR",
    icon: <Heart className="w-4 h-4" />,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  super_admin: {
    label: "Super Admin",
    formRole: "SUPER_ADMIN",
    icon: <ShieldCheck className="w-4 h-4" />,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
};

const ROLE_REDIRECT: Record<UserRole, string> = {
  DONATUR: "/dashboard/donatur/buat-donasi",
  RELAWAN: "/onboarding/relawan",
  SUPER_ADMIN: "/onboarding/admin",
};

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, show, dismiss } = useToast();

  const rawRole = searchParams.get("role");
  const roleKey: RoleKey =
    rawRole === "donatur" ? "donatur" : rawRole === "super_admin" ? "super_admin" : "relawan";
  const config = roleConfig[roleKey];

  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: config.formRole,
      password: "",
    },
  });

  useEffect(() => {
    setValue("role", config.formRole);
  }, [config.formRole, setValue]);

  const onSubmit = async (values: SignUpFormValues) => {
    if (!agree) {
      show("error", "Persetujuan diperlukan", "Anda harus menyetujui Syarat dan Ketentuan terlebih dahulu.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await authService.signup({ ...values, role: config.formRole });
      if (response.success && response.role) {
        router.push(ROLE_REDIRECT[response.role]);
      } else {
        show("error", "Pendaftaran gagal", response.error ?? "Terjadi kesalahan");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />

      <div className="flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-navy-800">tepatsalur</span>
        </div>

        {/* Role Badge */}
        <div className="mt-8">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${config.color} ${config.bg} ${config.border}`}>
            {config.icon}
            Daftar sebagai {config.label}
          </div>
        </div>

        {/* Header */}
        <div className="mt-5 space-y-1.5">
          <h1 className="text-[21px] font-bold tracking-tight text-navy-800">Buat Akun Baru</h1>
          <p className="text-sm text-ink-500">
            Bergabung dengan TepatSalur untuk membantu sesama.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium text-navy-700">Nama Lengkap</label>
            <input
              id="name"
              type="text"
              placeholder="Nama lengkap Anda"
              {...register("name")}
              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-navy-800 placeholder:text-ink-300 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/15 focus:outline-none transition-all"
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-navy-700">Email</label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              {...register("email")}
              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-navy-800 placeholder:text-ink-300 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/15 focus:outline-none transition-all"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="phone" className="text-sm font-medium text-navy-700">Nomor Telepon</label>
            <input
              id="phone"
              type="tel"
              placeholder="08xxxxxxxxxx"
              {...register("phone")}
              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-navy-800 placeholder:text-ink-300 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/15 focus:outline-none transition-all"
            />
            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium text-navy-700">Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                {...register("password")}
                className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 pr-11 text-sm text-navy-800 placeholder:text-ink-300 focus:border-blue-500 focus:ring-[3px] focus:ring-blue-500/15 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <input
              id="agree"
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-ink-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="agree" className="text-xs text-ink-500 leading-relaxed">
              Saya menyetujui{" "}
              <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Syarat dan Ketentuan
              </Link>{" "}
              serta{" "}
              <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Kebijakan Privasi
              </Link>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? "Mendaftarkan..." : `Daftar sebagai ${config.label}`}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-ink-200" />
          <span className="text-xs text-ink-400">atau</span>
          <div className="h-px flex-1 bg-ink-200" />
        </div>

        {/* <GoogleAuthButton mode="signup" requestedRole={roleKey} /> */}

        <p className="mt-6 text-center text-sm text-ink-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Masuk
          </Link>
        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2">
          {roleKey !== "relawan" && (
            <Link href="/register?role=relawan" className="text-xs text-ink-400 hover:text-ink-600 underline underline-offset-2 transition-colors">
              Daftar Relawan?
            </Link>
          )}
          {roleKey !== "donatur" && (
            <Link href="/register?role=donatur" className="text-xs text-ink-400 hover:text-ink-600 underline underline-offset-2 transition-colors">
              Daftar Donatur?
            </Link>
          )}
          {roleKey !== "super_admin" && (
            <Link href="/register?role=super_admin" className="text-xs text-ink-400 hover:text-ink-600 underline underline-offset-2 transition-colors">
              Daftar Super Admin?
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
