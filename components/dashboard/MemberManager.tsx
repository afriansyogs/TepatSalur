"use client";

import { useState, useRef, useEffect } from "react";
import { Users, Search, Shield, Tent, Mail, Phone, Check, ArrowUpDown, Ban, MoreVertical, MapPinPlus, Warehouse, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { superAdminService } from "@/services/super-admin.service";
import { LocationType, MemberData, LocationMetadata, MemberStatus } from "@/types/super-admin";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const roleDisplay: Record<LocationType, { label: string; color: string; bgColor: string }> = {
  UNASSIGNED: { label: "Relawan", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-100" },
  POSKO: { label: "Koordinator Posko", color: "text-amber-600", bgColor: "bg-amber-50 border-amber-100" },
  INVENTORY: { label: "Koordinator Basecamp", color: "text-purple-600", bgColor: "bg-purple-50 border-purple-100" },
};

const allRoles: LocationType[] = ["UNASSIGNED", "POSKO", "INVENTORY"];

function ActionMenu({
  member,
  onChangeRole,
  onToggleStatus,
  isProcessing
}: {
  member: MemberData;
  onChangeRole: (m: MemberData) => void;
  onToggleStatus: (id: string, currentStatus: MemberStatus) => void;
  isProcessing: boolean;
}) {
  return (
    <Popover>
      <PopoverTrigger
        disabled={isProcessing}
        className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
      >
        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MoreVertical className="w-4 h-4" />}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 bg-white border border-slate-200 rounded-2xl shadow-xl p-0 overflow-hidden flex flex-col">
        <button
          onClick={() => {
            onChangeRole(member);
          }}
          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left"
        >
          <ArrowUpDown className="w-4 h-4 text-blue-500" /> Ubah Role/Tugas
        </button>
        <button
          onClick={() => {
            onToggleStatus(member.id, member.status);
          }}
          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors text-left border-t border-slate-100"
        >
          <Ban className="w-4 h-4 text-slate-400" />
          {member.status === "ACTIVE" ? "Nonaktifkan" : "Aktifkan"}
        </button>
      </PopoverContent>
    </Popover>
  );
}

export function MemberManager() {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [poskos, setPoskos] = useState<LocationMetadata[]>([]);
  const [inventories, setInventories] = useState<LocationMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"ALL" | LocationType>("ALL");

  const [roleModal, setRoleModal] = useState<{
    isOpen: boolean;
    member: MemberData | null;
    selectedRole: LocationType | null;
    selectedLocationId: string | null;
  }>({
    isOpen: false,
    member: null,
    selectedRole: null,
    selectedLocationId: null,
  });

  const fetchData = async () => {
    try {
      const res = await superAdminService.getMembers();
      setMembers(res.data);
      setPoskos(res.metadata.poskos);
      setInventories(res.metadata.inventories);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: MemberStatus) => {
    try {
      setProcessingId(id);
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await superAdminService.updateMember(id, { status: newStatus });
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: newStatus } : m))
      );
    } catch (err) {
      console.error(err);
      alert("Gagal mengubah status member");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveRole = async () => {
    const { member, selectedRole, selectedLocationId } = roleModal;
    if (!member || !selectedRole) return;
    
    
    if (selectedRole === "POSKO" && !selectedLocationId) {
      return alert("Pilih posko tujuan");
    }
    if (selectedRole === "INVENTORY" && !selectedLocationId) {
      return alert("Pilih basecamp tujuan");
    }

    try {
      setProcessingId(member.id);
      setRoleModal((prev) => ({ ...prev, isOpen: false }));
      
      await superAdminService.updateMember(member.id, {
        assignmentType: selectedRole,
        poskoId: selectedRole === "POSKO" ? selectedLocationId || undefined : undefined,
        inventoryLocationId: selectedRole === "INVENTORY" ? selectedLocationId || undefined : undefined,
      });
      
      await fetchData(); 
    } catch (err) {
      console.error(err);
      alert("Gagal mengubah penugasan member");
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = members.filter((m) => {
    const searchLower = searchQuery.toLowerCase();
    const name = m.profile?.namaLengkap || m.name || "";
    const matchSearch =
      name.toLowerCase().includes(searchLower) ||
      m.email.toLowerCase().includes(searchLower);
    
    const currentRole = m.assignment?.assignmentType || "UNASSIGNED";
    const matchRole = filterRole === "ALL" || currentRole === filterRole;
    
    return matchSearch && matchRole;
  });

  const aktifCount = members.filter((m) => m.status === "ACTIVE").length;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Anggota Komunitas</h2>
          <p className="text-sm text-slate-500 mt-1">
            {aktifCount} anggota aktif dari {members.length} total terdaftar.
          </p>
        </div>
      </div>

      {}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none shadow-sm"
          />
        </div>
        <div className="flex gap-1.5 bg-white rounded-xl border border-slate-200 p-1 shadow-sm w-fit overflow-x-auto">
          {(["ALL", ...allRoles] as const).map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={cn(
                "px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap",
                filterRole === role
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              {role === "ALL" ? "Semua" : roleDisplay[role as LocationType].label}
            </button>
          ))}
        </div>
      </div>

      {}
      <div className="hidden md:block bg-white border border-slate-200 rounded-3xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Anggota</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Penugasan</th>
              <th className="text-left px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-center px-4 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider w-20">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((member) => {
              const currentRole = member.assignment?.assignmentType || "UNASSIGNED";
              const roleCfg = roleDisplay[currentRole];
              const locationName = member.assignment?.location?.name || "-";
              
              return (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                        <img
                          src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.name}&backgroundColor=f1f5f9`}
                          alt={member.name}
                          className="w-full h-full object-cover scale-110"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 leading-tight">
                          {member.profile?.namaLengkap || member.name}
                        </p>
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
                      <Tent className="w-3.5 h-3.5 text-slate-400" /> {locationName}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border",
                      member.status === "ACTIVE" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                        : member.status === "PENDING"
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : "bg-slate-50 text-slate-400 border-slate-100"
                    )}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <ActionMenu 
                      member={member} 
                      onChangeRole={(m) => setRoleModal({
                        isOpen: true,
                        member: m,
                        selectedRole: m.assignment?.assignmentType || "UNASSIGNED",
                        selectedLocationId: m.assignment?.location?.id || null
                      })} 
                      onToggleStatus={handleToggleStatus} 
                      isProcessing={processingId === member.id}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>

      {}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {filtered.map((member) => {
          const currentRole = member.assignment?.assignmentType || "UNASSIGNED";
          const roleCfg = roleDisplay[currentRole];
          const locationName = member.assignment?.location?.name || "-";

          return (
            <div key={member.id} className="bg-white border border-slate-200 rounded-3xl p-5 hover:border-blue-300 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                    <img
                      src={`https://api.dicebear.com/7.x/notionists/svg?seed=${member.name}&backgroundColor=f1f5f9`}
                      alt={member.name}
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 leading-tight">
                      {member.profile?.namaLengkap || member.name}
                    </h3>
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold mt-0.5", roleCfg.color)}>
                      <Shield className="w-3 h-3" /> {roleCfg.label}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider border",
                    member.status === "ACTIVE" 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                        : member.status === "PENDING"
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : "bg-slate-50 text-slate-400 border-slate-100"
                  )}>
                    {member.status}
                  </span>
                  <ActionMenu 
                    member={member} 
                    onChangeRole={(m) => setRoleModal({
                      isOpen: true,
                      member: m,
                      selectedRole: m.assignment?.assignmentType || "UNASSIGNED",
                      selectedLocationId: m.assignment?.location?.id || null
                    })} 
                    onToggleStatus={handleToggleStatus}
                    isProcessing={processingId === member.id} 
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs pl-14">
                <div className="flex items-center gap-2 text-slate-500">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium truncate">{member.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">{member.phone || "-"}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Tent className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium truncate">{locationName}</span>
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

      {}
      {roleModal.isOpen && roleModal.member && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-lg">Ubah Penugasan</h3>
              <button 
                onClick={() => setRoleModal({ isOpen: false, member: null, selectedRole: null, selectedLocationId: null })}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 overflow-hidden flex-shrink-0">
                  <img
                    src={`https://api.dicebear.com/7.x/notionists/svg?seed=${roleModal.member.name}&backgroundColor=f1f5f9`}
                    alt={roleModal.member.name}
                    className="w-full h-full object-cover scale-110"
                  />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm leading-tight">
                    {roleModal.member.profile?.namaLengkap || roleModal.member.name}
                  </p>
                  <p className="text-[11px] text-slate-500">{roleModal.member.email}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pilih Role</p>
                <div className="grid grid-cols-1 gap-2">
                  {allRoles.map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleModal(prev => ({ ...prev, selectedRole: role, selectedLocationId: null }))}
                      className={cn(
                        "px-4 py-3 rounded-2xl border text-sm font-bold text-left transition-all flex items-center justify-between",
                        roleModal.selectedRole === role 
                          ? "bg-blue-50 border-blue-200 text-blue-700" 
                          : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {role === "POSKO" && <MapPinPlus className="w-4 h-4" />}
                        {role === "INVENTORY" && <Warehouse className="w-4 h-4" />}
                        {role === "UNASSIGNED" && <Users className="w-4 h-4" />}
                        {roleDisplay[role].label}
                      </div>
                      {roleModal.selectedRole === role && <Check className="w-4 h-4 text-blue-500" />}
                    </button>
                  ))}
                </div>
              </div>

              {roleModal.selectedRole === "POSKO" && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                    Pilih Posko Tujuan
                  </label>
                  <select
                    value={roleModal.selectedLocationId || ""}
                    onChange={(e) => setRoleModal(prev => ({ ...prev, selectedLocationId: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="" disabled>-- Pilih Posko --</option>
                    {poskos.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {roleModal.selectedRole === "INVENTORY" && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                    Pilih Basecamp Tujuan
                  </label>
                  <select
                    value={roleModal.selectedLocationId || ""}
                    onChange={(e) => setRoleModal(prev => ({ ...prev, selectedLocationId: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="" disabled>-- Pilih Basecamp --</option>
                    {inventories.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
              )}

            </div>
            
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setRoleModal({ isOpen: false, member: null, selectedRole: null, selectedLocationId: null })}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveRole}
                disabled={
                  processingId === roleModal.member.id || 
                  (roleModal.selectedRole === "POSKO" && !roleModal.selectedLocationId) ||
                  (roleModal.selectedRole === "INVENTORY" && !roleModal.selectedLocationId)
                }
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-blue-600"
              >
                {processingId === roleModal.member.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Simpan Penugasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
