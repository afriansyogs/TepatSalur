"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import type { User } from "@/types/auth";
import {
  Package, MapPinPlus, Menu, X, Tent, LogOut,
  ChevronLeft, ChevronRight, ShieldCheck,
  Warehouse, Users, UserPlus, Truck, LayoutDashboard, Mic,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Home } from "lucide-react";

type MenuItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  section?: string;
  href: string;
};

const allMenuItems: MenuItem[] = [
  // Super Admin menus
  { id: "manage-basecamp",  label: "Manage Basecamp",  icon: Warehouse,      roles: ["super_admin"], section: "Super Admin", href: "/dashboard/super-admin/manage-basecamp" },
  { id: "tambah-posko",     label: "Add Posko/Basecamp",     icon: MapPinPlus,      roles: ["super_admin"], section: "Super Admin", href: "/dashboard/super-admin/tambah-posko" },
  { id: "manage-member",    label: "Manage Member",     icon: UserPlus,        roles: ["super_admin"], section: "Super Admin", href: "/dashboard/super-admin/manage-member" },

  // Relawan Posko menus
  { id: "manajemen-posko",  label: "Manajemen Posko",  icon: Tent,            roles: ["relawan"],     section: "Relawan Posko", href: "/dashboard/relawan/manajemen-posko" },
  { id: "manajemen-bantuan",label: "Manajemen Bantuan", icon: Package,         roles: ["relawan"],     section: "Relawan Posko", href: "/dashboard/relawan/manajemen-bantuan" },
  { id: "input-suara",     label: "Input Suara AI",    icon: Mic,             roles: ["relawan"],     section: "Relawan Posko", href: "/dashboard/relawan/input-suara" },
  { id: "distribusi",      label: "Distribusi AI",     icon: Truck,           roles: ["relawan"],     section: "Relawan Posko", href: "/dashboard/relawan/distribusi" },

  // Donatur menus
  { id: "buat-donasi",      label: "Donasi Baru",       icon: MapPinPlus,      roles: ["donatur"],     section: "Donatur", href: "/dashboard/donatur/buat-donasi" },
  { id: "tracking-bantuan", label: "Tracking Bantuan",  icon: Truck,           roles: ["donatur"],     section: "Donatur", href: "/dashboard/donatur/tracking-bantuan" },
];

const roleConfig: Record<string, { label: string; color: string; defaultPath: string }> = {
  super_admin: { label: "Super Admin", color: "text-amber-400", defaultPath: "/dashboard/super-admin/manage-basecamp" },
  relawan:     { label: "Relawan",     color: "text-blue-400",  defaultPath: "/dashboard/relawan/manajemen-posko" },
  donatur:     { label: "Donatur",     color: "text-emerald-400", defaultPath: "/dashboard/donatur/buat-donasi" },
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<string>("relawan");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          router.push("/");
          return;
        }
        setUser(currentUser);
        const mappedRole = currentUser.role.toLowerCase();
        setCurrentRole(mappedRole);
        
        // Redirect if on root dashboard or default role route
        if (pathname === "/dashboard" || pathname === `/dashboard/${mappedRole}`) {
           router.push(roleConfig[mappedRole]?.defaultPath || "/");
        }
      } catch (err) {
        console.error("Dashboard auth error:", err);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [router, pathname]);

  const visibleMenus = user?.status === "PENDING" ? [] : allMenuItems.filter(m => m.roles.includes(currentRole));

  const handleLogout = async () => {
    try {
      await authService.logout();
      router.push("/");
    } catch (err) {
      console.error(err);
      router.push("/");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const sections = [...new Set(visibleMenus.map(m => m.section))];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 border-r border-slate-800 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 h-full text-white",
        isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
        isMinimized ? "lg:w-20" : "lg:w-64"
      )}>
        {/* Top: Logo & Toggle */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-slate-800">
          <Link href="/" className={cn("flex items-center gap-2.5 overflow-hidden transition-all", isMinimized ? "w-0 opacity-0 hidden" : "w-auto opacity-100")}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">tepatsalur</span>
          </Link>
          {isMinimized && (
            <div className="hidden lg:flex flex-1 items-center justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-sm flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            {isMinimized ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
          {sections.map((section) => (
            <div key={section} className="mb-4">
              {!isMinimized && (
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">{section}</p>
              )}
              <nav className="space-y-1">
                {visibleMenus.filter(m => m.section === section).map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "w-full flex items-center px-3 py-3 rounded-xl text-sm font-bold transition-all group overflow-hidden",
                        isActive
                          ? "bg-blue-600/10 text-blue-400"
                          : "text-slate-400 hover:bg-slate-800 hover:text-white",
                        isMinimized ? "justify-center" : "gap-3"
                      )}
                      title={isMinimized ? item.label : undefined}
                    >
                      <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-blue-500" : "group-hover:text-white")} />
                      {!isMinimized && <span className="truncate">{item.label}</span>}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
          
          <div className="mt-8 mb-4">
            {!isMinimized && (
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 px-3">Umum</p>
            )}
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "w-full flex items-center px-3 py-3 rounded-xl text-sm font-bold transition-all group overflow-hidden text-slate-400 hover:bg-slate-800 hover:text-white",
                isMinimized ? "justify-center" : "gap-3"
              )}
              title={isMinimized ? "Kembali ke Beranda" : undefined}
            >
              <Home className="w-5 h-5 flex-shrink-0 group-hover:text-white transition-colors" />
              {!isMinimized && <span className="truncate">Kembali ke Beranda</span>}
            </Link>
          </div>
        </div>

        {/* Bottom: User Profile & Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className={cn("flex items-center bg-slate-800/50 p-2 rounded-2xl border border-slate-700/50 transition-all overflow-hidden", isMinimized ? "justify-center" : "gap-3")}>
            <div className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 overflow-hidden flex-shrink-0">
              <img
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.name || "User"}&backgroundColor=1e293b`}
                alt="Avatar"
                className="w-full h-full object-cover scale-110"
              />
            </div>
            {!isMinimized && (
              <div className="flex flex-col truncate flex-1">
                <span className="text-white text-[13px] font-black leading-tight tracking-wide truncate">
                  {user?.name || "User"}
                </span>
                <span className={cn("flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase mt-0.5", roleConfig[currentRole]?.color)}>
                  <ShieldCheck className="w-3 h-3" /> {roleConfig[currentRole]?.label}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center mt-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 group overflow-hidden",
              isMinimized ? "justify-center" : "gap-3"
            )}
            title={isMinimized ? "Keluar" : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isMinimized && <span>Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <span className="font-bold text-slate-800">tepatsalur</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 w-full max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
