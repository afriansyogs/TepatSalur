"use client";

import { useState, useRef, useEffect } from "react";
import { Users, UserPlus, Search, Shield, Tent, Mail, Phone, ChevronDown, Check, ArrowUpDown, Ban, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type MemberRole = "relawan" | "koordinator_posko" | "koordinator_basecamp";

type Member = {
  id: string;
  nama: string;
  email: string;
  telepon: string;
  role: MemberRole;
  basecamp: string;
  status: "aktif" | "nonaktif";
  joinDate: string;
};

const roleDisplay: Record<MemberRole, { label: string; color: string; bgColor: string }> = {
  relawan:              { label: "Relawan",              color: "text-blue-600",   bgColor: "bg-blue-50 border-blue-100" },
  koordinator_posko:    { label: "Koordinator Posko",    color: "text-amber-600",  bgColor: "bg-amber-50 border-amber-100" },
  koordinator_basecamp: { label: "Koordinator Basecamp", color: "text-purple-600", bgColor: "bg-purple-50 border-purple-100" },
};

const allRoles: MemberRole[] = ["relawan", "koordinator_posko", "koordinator_basecamp"];

const initialMembers: Member[] = [
  { id: "M-001", nama: "Ahmad Rizki", email: "ahmad@mail.com", telepon: "0812-3456-7890", role: "koordinator_basecamp", basecamp: "Basecamp Utama Kota", status: "aktif", joinDate: "2026-06-01" },
  { id: "M-002", nama: "Siti Nurhaliza", email: "siti@mail.com", telepon: "0813-5678-1234", role: "koordinator_posko", basecamp: "Basecamp Timur", status: "aktif", joinDate: "2026-06-05" },
  { id: "M-003", nama: "Budi Santoso", email: "budi@mail.com", telepon: "0856-1234-5678", role: "relawan", basecamp: "Basecamp Utama Kota", status: "aktif", joinDate: "2026-06-10" },
  { id: "M-004", nama: "Dewi Lestari", email: "dewi@mail.com", telepon: "0878-9012-3456", role: "relawan", basecamp: "Basecamp Timur", status: "nonaktif", joinDate: "2026-06-15" },
  { id: "M-005", nama: "Andi Permana", email: "andi@mail.com", telepon: "0821-0987-6543", role: "relawan", basecamp: "Basecamp Utama Kota", status: "aktif", joinDate: "2026-07-01" },
];

function ActionMenu({ member, onChangeRole, onToggleStatus }: { member: Member; onChangeRole: (id: string, role: MemberRole) => void; onToggleStatus: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowRolePicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => { setOpen(!open); setShowRolePicker(false); }}
        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {!showRolePicker ? (
            <>
              <button
                onClick={() => setShowRolePicker(true)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <ArrowUpDown className="w-4 h-4 text-blue-500" /> Ubah Role
              </button>
              <button
                onClick={() => { onToggleStatus(member.id); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left border-t border-slate-100"
              >
                <Ban className="w-4 h-4 text-slate-400" />
                {member.status === "aktif" ? "Nonaktifkan" : "Aktifkan"}
              </button>
            </>
          ) : (
            <div className="p-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 py-1.5">Pilih Role Baru</p>
              {allRoles.map(role => {
                const cfg = roleDisplay[role];
                const isActive = member.role === role;
                return (
                  <button
                    key={role}
                    onClick={() => {
                      if (!isActive) onChangeRole(member.id, role);
                      setOpen(false);
                      setShowRolePicker(false);
                    }}
                    disabled={isActive}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left mb-0.5",
                      isActive ? "bg-slate-50 text-slate-400 cursor-default" : "hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Shield className={cn("w-4 h-4", isActive ? "text-slate-300" : cfg.color)} />
                      {cfg.label}
                    </span>
                    {isActive && <Check className="w-4 h-4 text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MemberManager() {
  const [members, setMembers] = useState(initialMembers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"semua" | MemberRole>("semua");

  const handleChangeRole = (id: string, newRole: MemberRole) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, role: newRole } : m));
  };

  const handleToggleStatus = (id: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, status: m.status === "aktif" ? "nonaktif" : "aktif" } : m));
  };

  const filtered = members.filter(m => {
    const matchSearch = m.nama.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = filterRole === "semua" || m.role === filterRole;
    return matchSearch && matchRole;
  });

  const aktifCount = members.filter(m => m.status === "aktif").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Anggota Komunitas</h2>
          <p className="text-sm text-slate-500 mt-1">{aktifCount} anggota aktif dari {members.length} total terdaftar.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-sm w-fit">
          <UserPlus className="w-4 h-4" /> Undang Anggota
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none shadow-sm"
          />
        </div>
        <div className="flex gap-1.5 bg-white rounded-xl border border-slate-200 p-1 shadow-sm w-fit overflow-x-auto">
          {(["semua", ...allRoles] as const).map(role => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={cn(
                "px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
                filterRole === role ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              {role === "semua" ? "Semua" : roleDisplay[role].label}
            </button>
          ))}
        </div>
      </div>

      {/* Member Table (Desktop) */}
      <div className="hidden md:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Anggota</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Basecamp</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-20">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(member => {
              const roleCfg = roleDisplay[member.role];
              return (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                        <img
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.nama}&backgroundColor=f1f5f9`}
                          alt={member.nama}
                          className="w-full h-full object-cover scale-110"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 leading-tight">{member.nama}</p>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border", roleCfg.bgColor, roleCfg.color)}>
                      <Shield className="w-3 h-3" /> {roleCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                      <Tent className="w-3.5 h-3.5 text-slate-400" /> {member.basecamp}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border",
                      member.status === "aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                    )}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <ActionMenu member={member} onChangeRole={handleChangeRole} onToggleStatus={handleToggleStatus} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Member Cards (Mobile) */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {filtered.map(member => {
          const roleCfg = roleDisplay[member.role];
          return (
            <div key={member.id} className="bg-white border border-slate-200 rounded-3xl p-5 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.nama}&backgroundColor=f1f5f9`}
                      alt={member.nama}
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 leading-tight">{member.nama}</h3>
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold mt-0.5", roleCfg.color)}>
                      <Shield className="w-3 h-3" /> {roleCfg.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border",
                    member.status === "aktif" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"
                  )}>
                    {member.status}
                  </span>
                  <ActionMenu member={member} onChangeRole={handleChangeRole} onToggleStatus={handleToggleStatus} />
                </div>
              </div>

              <div className="space-y-1.5 text-xs pl-14">
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">{member.telepon}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Tent className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium truncate">{member.basecamp}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-400">Tidak ada anggota yang ditemukan.</p>
        </div>
      )}
    </div>
  );
}
