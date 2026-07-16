"use client";

import { useState } from "react";
import { Eye, EyeOff, ShieldCheck, Heart, Users } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormValues } from "@/schemas/auth";
import { authService } from "@/services/auth.service";
import { ToastContainer, useToast } from "@/components/ui/toast";

type Role = "relawan" | "donatur";

const roleConfig: Record<Role, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
  relawan: {
    label: "Relawan",
    icon: <Users className="w-4 h-4" />,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  donatur: {
    label: "Donatur",
    icon: <Heart className="w-4 h-4" />,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toasts, show, dismiss } = useToast();

  const rawRole = searchParams.get("role");
  const role: Role = rawRole === "donatur" ? "donatur" : "relawan";
  const config = roleConfig[role];

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await authService.login(values);
      if (response.success) {
        const user = await authService.getCurrentUser();
        show("success", "Login berhasil!", `Selamat datang kembali${user?.name ? `, ${user.name}` : ""}.`);
        setTimeout(() => {
          if (user?.role === "SUPER_ADMIN") {
            if (!user.communityId) {
              router.push("/onboarding/admin");
            } else {
              router.push("/dashboard/super-admin");
            }
          } else if (user?.role === "DONATUR") {
            router.push("/dashboard/donatur/buat-donasi");
          } else if (user?.role === "RELAWAN") {
            if (!user.communityId) {
              router.push("/onboarding/relawan");
            } else {
              router.push("/dashboard/relawan");
            }
          }
        }, 1200);
      } else {
        show("error", "Login gagal", response.error || "Periksa kembali email dan password Anda.");
      }
    } catch (err: unknown) {
      show("error", "Terjadi kesalahan", err instanceof Error ? err.message : "Silakan coba lagi.");
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
            Masuk sebagai {config.label}
          </div>
        </div>

        {/* Header */}
        <div className="mt-5 space-y-1.5">
          <h1 className="text-[21px] font-bold tracking-tight text-navy-800">Sign in</h1>
          <p className="text-sm text-ink-500">
            Masuk ke akun {config.label} Anda untuk melanjutkan.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
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
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-navy-700">Password</label>
              <Link href="/forgot-password" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                Lupa password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password Anda"
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : `Masuk sebagai ${config.label}`}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-ink-200" />
          <span className="text-xs text-ink-400">atau</span>
          <div className="h-px flex-1 bg-ink-200" />
        </div>

        <GoogleAuthButton mode="login" requestedRole={role} />

        <p className="mt-6 text-center text-sm text-ink-500">
          Belum punya akun?{" "}
          <Link href={`/register?role=${role}`} className="font-semibold text-blue-600 hover:text-blue-700">
            Daftar sebagai {config.label}
          </Link>
        </p>

        <div className="mt-3 text-center">
          <Link
            href={role === "relawan" ? "/login?role=donatur" : "/login?role=relawan"}
            className="text-xs text-ink-400 hover:text-ink-600 underline underline-offset-2 transition-colors"
          >
            {role === "relawan" ? "Masuk sebagai Donatur?" : "Masuk sebagai Relawan?"}
          </Link>
        </div>
      </div>
    </>
  );
}
