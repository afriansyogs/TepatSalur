"use client";

import Link from "next/link";
import { ChevronDown, LogOut, ShieldCheck, LayoutDashboard, Heart } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/types/auth";

type Role = { label: string; href: string };

const loginRoles: Role[] = [
  { label: "Relawan", href: "/login?role=relawan" },
  { label: "Donatur", href: "/login?role=donatur" },
];

const registerRoles: Role[] = [
  { label: "Relawan", href: "/register?role=relawan" },
  { label: "Donatur", href: "/register?role=donatur" },
  { label: "Super Admin", href: "/register?role=super_admin" },
];

const ROLE_DASHBOARD: Record<string, string> = {
  SUPER_ADMIN: "/dashboard/super-admin",
  RELAWAN: "/dashboard/relawan",
  DONATUR: "/dashboard/donatur/buat-donasi",
};

function DropdownButton({
  label,
  roles,
  variant,
}: {
  label: string;
  roles: Role[];
  variant: "ghost" | "primary";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "text-sm font-semibold flex items-center gap-1.5 px-4 py-2.5 rounded-full transition-all",
          variant === "ghost"
            ? "text-slate-700 bg-slate-100 hover:bg-slate-200"
            : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
        )}
      >
        {label}
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {roles.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors first:pt-3.5 last:pb-3.5"
            >
              {r.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileDropdown({
  user,
  onLogout,
}: {
  user: User;
  onLogout: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const role = user.role.toUpperCase();
  const isDonatur = role === "DONATUR";
  const dashboardHref = ROLE_DASHBOARD[role] ?? "/dashboard/relawan";
  const dashboardLabel = isDonatur ? "Halaman Donasi" : "Dashboard Bantuan";
  const DashboardIcon = isDonatur ? Heart : LayoutDashboard;

  const roleLabel: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    RELAWAN: "Relawan",
    DONATUR: "Donatur",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white hover:bg-slate-50 border border-slate-200 pr-3 pl-5 py-1.5 rounded-full transition-colors shadow-sm"
      >
        <div className="flex flex-col items-end text-right">
          <span className="text-slate-800 text-[13px] font-black leading-tight tracking-wide">
            {user.name}
          </span>
          <span className="flex items-center gap-1 text-blue-600 text-[10px] font-black tracking-wider uppercase mt-0.5">
            <ShieldCheck className="w-3 h-3" /> {roleLabel[role] ?? role}
          </span>
        </div>
        <div className="w-9 h-9 rounded-full bg-slate-100 border-[2px] border-blue-100 overflow-hidden flex-shrink-0">
          <img
            src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(user.name)}&backgroundColor=e0f2fe`}
            alt="Avatar"
            className="w-full h-full object-cover scale-110"
          />
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform duration-300",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-3 w-[220px] bg-white rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            href={dashboardHref}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3.5 px-3 py-3 hover:bg-blue-50/50 rounded-2xl transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 transition-colors">
              <DashboardIcon className="w-[18px] h-[18px]" />
            </div>
            <span className="font-bold text-slate-700 group-hover:text-blue-700 transition-colors text-[14px]">{dashboardLabel}</span>
          </Link>
          <div className="h-px bg-slate-100 my-1 mx-3" />
          <button
            onClick={() => { setIsOpen(false); onLogout(); }}
            className="w-full flex items-center gap-3.5 px-3 py-3 hover:bg-rose-50 rounded-2xl transition-colors text-rose-600 group"
          >
            <div className="w-9 h-9 rounded-full bg-rose-50 group-hover:bg-rose-100 transition-colors flex items-center justify-center flex-shrink-0">
              <LogOut className="w-[18px] h-[18px]" />
            </div>
            <span className="font-bold text-[14px]">Keluar</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async () => {
      try {
        const u = await authService.getCurrentUser();
        setUser(u);
      } catch {
        setUser(null);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        await loadUser();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push("/");
    } catch {
    }
  };

  return (
    <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4">
      <nav
        className={`w-full max-w-5xl py-3 px-4 sm:px-6 rounded-full border flex justify-between items-center transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.1)] border-slate-200"
            : "bg-white/90 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.08)] border-slate-100"
        }`}
      >
        <div className="text-xl font-bold text-blue-600 flex items-center gap-2 font-heading">
          TepatSalur
        </div>

        <div className="hidden md:flex items-center gap-8 font-medium text-slate-600 text-sm">
          <Link
            href="/"
            className={cn(
              "px-1 pb-1 border-b-2 transition-colors",
              pathname === "/" ? "text-blue-600 border-blue-600" : "border-transparent hover:text-blue-600"
            )}
          >
            Home
          </Link>
          <Link
            href="/maps"
            className={cn(
              "px-1 pb-1 border-b-2 transition-colors",
              pathname === "/maps" ? "text-blue-600 border-blue-600" : "border-transparent hover:text-blue-600"
            )}
          >
            Maps
          </Link>
          <Link href="/#how" className="px-1 pb-1 border-b-2 border-transparent hover:text-blue-600 transition-colors">
            Cara Kerja
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* DEV ONLY: akses cepat ke dashboard */}
          {/* <Link
            href="/dashboard/relawan"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </Link> */}

          {user ? (
            <ProfileDropdown user={user} onLogout={handleLogout} />
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold px-4 py-2.5 rounded-full text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="text-sm font-semibold px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
              >
                Daftar
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}
