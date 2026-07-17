"use client";

import { useState } from "react";
import { Package, Clock, CheckCircle, Truck, XCircle, MapPin, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryDonasiItem } from "@/types/inventory";

interface DonasiCardProps {
  donasi: InventoryDonasiItem;
  onAccept: (id: string) => Promise<void>;
  onConfirm: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
}

const CATEGORY_COLORS: Record<string, string> = {
  MAKANAN: "bg-orange-100 text-orange-700 border-orange-200",
  PAKAIAN: "bg-blue-100 text-blue-700 border-blue-200",
  OBAT: "bg-purple-100 text-purple-700 border-purple-200",
  LAINNYA: "bg-slate-100 text-slate-700 border-slate-200",
};

const STATUS_CONFIG = {
  PENDING: { label: "Menunggu", icon: Clock, bg: "bg-amber-50 text-amber-700 border-amber-200" },
  DELIVERY: { label: "Dalam Perjalanan", icon: Truck, bg: "bg-blue-50 text-blue-700 border-blue-200" },
  ACCEPTED: { label: "Diterima", icon: CheckCircle, bg: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  REJECTED: { label: "Ditolak", icon: XCircle, bg: "bg-rose-50 text-rose-700 border-rose-200" },
};

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant: "primary" | "danger";
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2",
              confirmVariant === "danger"
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-blue-600 hover:bg-blue-700"
            )}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function DonasiCard({ donasi, onAccept, onConfirm, onReject }: DonasiCardProps) {
  const [confirmAction, setConfirmAction] = useState<"accept" | "confirm" | "reject" | null>(null);
  const [loading, setLoading] = useState(false);

  const statusCfg = STATUS_CONFIG[donasi.status];
  const StatusIcon = statusCfg.icon;
  const catColor = CATEGORY_COLORS[donasi.category] ?? CATEGORY_COLORS.LAINNYA;

  const handleAction = async (action: "accept" | "confirm" | "reject") => {
    setLoading(true);
    try {
      if (action === "accept") await onAccept(donasi.id);
      else if (action === "confirm") await onConfirm(donasi.id);
      else await onReject(donasi.id);
    } catch {
      
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const timeLabel = new Date(donasi.createdAt).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });

  return (
    <>
      <div className="border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-blue-200 hover:shadow-md bg-white">
        <div className="space-y-3 flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
              {donasi.id.slice(0, 8)}
            </span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1", statusCfg.bg)}>
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </span>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", catColor)}>
              {donasi.category}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
            <Package className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="font-bold text-slate-800">{donasi.itemName}</span>
            <span className="text-slate-400">x</span>
            <span className="font-black text-slate-900">{donasi.qtyDonated}</span>
          </div>

          {donasi.donatur && (
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              Donatur: <span className="font-bold text-slate-800">{donasi.donatur.name}</span>
            </div>
          )}

          {donasi.alamatPickup && (
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{donasi.alamatPickup}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            {timeLabel}
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-wrap gap-2">
          {donasi.status === "PENDING" && (
            <>
              <button
                onClick={() => setConfirmAction("reject")}
                className="px-4 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
              >
                Tolak
              </button>
              <button
                onClick={() => setConfirmAction("accept")}
                className="px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
              >
                Terima
              </button>
            </>
          )}
          {donasi.status === "DELIVERY" && (
            <button
              onClick={() => setConfirmAction("confirm")}
              className="px-4 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-sm flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Konfirmasi Tiba
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction === "accept"}
        title="Terima Donasi"
        description="Tandai donasi ini sedang dalam perjalanan ke gudang?"
        confirmLabel="Ya, Terima"
        confirmVariant="primary"
        loading={loading}
        onConfirm={() => handleAction("accept")}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === "confirm"}
        title="Konfirmasi Tiba"
        description="Barang sudah tiba di gudang? Stok akan otomatis bertambah."
        confirmLabel="Konfirmasi"
        confirmVariant="primary"
        loading={loading}
        onConfirm={() => handleAction("confirm")}
        onCancel={() => setConfirmAction(null)}
      />
      <ConfirmDialog
        open={confirmAction === "reject"}
        title="Tolak Donasi"
        description="Yakin ingin menolak donasi ini?"
        confirmLabel="Ya, Tolak"
        confirmVariant="danger"
        loading={loading}
        onConfirm={() => handleAction("reject")}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
