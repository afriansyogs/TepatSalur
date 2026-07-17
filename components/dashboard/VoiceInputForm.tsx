"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { poskoVoiceInputSchema, type PoskoVoiceInputValues } from "@/schemas/ai";
import { relawanService } from "@/services/relawan.service";
import { aiService } from "@/services/ai.service";
import type { AssignedPosko, VoiceParseResult } from "@/types/ai";
import { cn } from "@/lib/utils";
import {
  Mic, MicOff, Square, Loader2, Save, Plus, X,
  MapPin, Users, AlertTriangle, CheckCircle2, Sparkles,
  Clock, RefreshCw,
} from "lucide-react";

type RecordingState = "idle" | "recording" | "processing" | "done";

const KATEGORI_OPTIONS = [
  { value: "MAKANAN" as const, label: "Makanan", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "PAKAIAN" as const, label: "Pakaian", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  { value: "OBAT" as const, label: "Obat", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "LAINNYA" as const, label: "Lainnya", color: "bg-slate-100 text-slate-700 border-slate-200" },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function VoiceInputForm() {
  const [posko, setPosko] = useState<AssignedPosko | null>(null);
  const [isLoadingPosko, setIsLoadingPosko] = useState(true);
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<{ status: "MERAH" | "KUNING" | "HIJAU"; score: number } | null>(null);
  const [isTriageOpen, setIsTriageOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<PoskoVoiceInputValues>({
    resolver: zodResolver(poskoVoiceInputSchema),
    defaultValues: {
      poskoId: "",
      jumlahPengungsi: 0,
      jumlahDewasa: 0,
      jumlahAnak: 0,
      jumlahBalita: 0,
      jumlahLansia: 0,
      jumlahDisabilitas: 0,
      jumlahIbuHamil: 0,
      catatanMedisDarurat: "",
      kebutuhan: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "kebutuhan",
  });

  const watchedKebutuhan = watch("kebutuhan");
  const totalPengungsi = watch("jumlahPengungsi") || 0;

  const loadPosko = useCallback(async () => {
    setIsLoadingPosko(true);
    const assigned = await relawanService.getAssignedPosko();
    setPosko(assigned);
    if (assigned) {
      setValue("poskoId", assigned.id);
      setValue("jumlahPengungsi", assigned.jumlahPengungsi || 0);
      setValue("jumlahDewasa", assigned.jumlahDewasa || 0);
      setValue("jumlahAnak", assigned.jumlahAnak || 0);
      setValue("jumlahBalita", assigned.jumlahBalita || 0);
      setValue("jumlahLansia", assigned.jumlahLansia || 0);
      setValue("jumlahDisabilitas", assigned.jumlahDisabilitas || 0);
      setValue("jumlahIbuHamil", assigned.jumlahIbuHamil || 0);
      setValue("catatanMedisDarurat", assigned.catatanMedisDarurat ?? "");
      // Do not prepopulate kebutuhan so we don't duplicate on save
    }
    setIsLoadingPosko(false);
  }, [setValue]);

  useEffect(() => {
    loadPosko();
  }, [loadPosko]);

  const cleanupRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  useEffect(() => {
    return cleanupRecording;
  }, [cleanupRecording]);

  const startRecording = async () => {
    try {
      setAiError(null);
      setDuration(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        streamRef.current?.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];

        if (!posko) return;

        setRecordingState("processing");

        const result = await aiService.parseVoiceInput(blob, posko.id);

        if (!result.success || !result.data) {
          setAiError(result.error ?? "Gagal memproses audio");
          setRecordingState("idle");
          return;
        }

        applyAiResult(result.data);
        setRecordingState("done");
      };

      recorder.start();
      setRecordingState("recording");

      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      setAiError("Tidak dapat mengakses mikrofon. Pastikan izin diberikan.");
      setRecordingState("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const applyAiResult = (data: VoiceParseResult) => {
    setValue("jumlahPengungsi", data.jumlahPengungsi);
    setValue("jumlahDewasa", data.jumlahDewasa);
    setValue("jumlahAnak", data.jumlahAnak);
    setValue("jumlahLansia", data.jumlahLansia);
    setValue("jumlahDisabilitas", data.jumlahDisabilitas);
    setValue("jumlahIbuHamil", data.jumlahIbuHamil);
    setValue("catatanMedisDarurat", data.catatanMedisDarurat);

    replace(data.kebutuhan.map((item) => ({
      kategori: item.kategori,
      namaBarang: item.namaBarang,
      qtyNeeded: item.qtyNeeded
    })));
  };

  const resetForm = () => {
    setRecordingState("idle");
    setSaveStatus("idle");
    setAiError(null);
    setSaveError(null);
    if (posko) {
      reset({
        poskoId: posko.id,
        jumlahPengungsi: posko.jumlahPengungsi,
        jumlahDewasa: posko.jumlahDewasa || 0,
        jumlahAnak: posko.jumlahAnak || 0,
        jumlahBalita: posko.jumlahBalita || 0,
        jumlahLansia: posko.jumlahLansia || 0,
        jumlahDisabilitas: posko.jumlahDisabilitas,
        jumlahIbuHamil: posko.jumlahIbuHamil || 0,
        catatanMedisDarurat: posko.catatanMedisDarurat ?? "",
        kebutuhan: [], // Voice input only appends, keep empty on reset
      });
    }
  };

  const onSubmit = async (values: PoskoVoiceInputValues) => {
    if (!posko) return;
    setSaveStatus("saving");
    setSaveError(null);

    const { poskoId: _, ...body } = values;
    const result = await relawanService.updatePoskoData(posko.id, body);

    if (result.success) {
      setSaveStatus("saved");
      await loadPosko();
      
      if (result.aiStatus && result.aiUrgencyScore !== undefined) {
        setTriageResult({ status: result.aiStatus, score: result.aiUrgencyScore });
        setIsTriageOpen(true);
      }
    } else {
      setSaveStatus("error");
      setSaveError(result.error ?? "Gagal menyimpan");
    }
  };

  if (isLoadingPosko) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Memuat data posko...</p>
        </div>
      </div>
    );
  }

  if (!posko) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-800 mb-2">Tidak Ada Posko Ditugaskan</h3>
          <p className="text-sm text-slate-600">
            Anda belum ditugaskan ke posko manapun. Hubungi Super Admin komunitas Anda untuk mendapatkan penugasan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] -m-6">
      {/* Left Sidebar: Voice Note */}
      <div className="w-full lg:w-1/3 bg-slate-50 border-r border-slate-200 p-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-center mb-8 max-w-[250px]">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Input Suara AI</h3>
          <p className="text-xs text-slate-500">
            Tekan tombol di bawah lalu laporkan kondisi posko. AI akan otomatis mengisikan form untuk Anda.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          {recordingState === "idle" && (
            <button
              type="button"
              onClick={startRecording}
              className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl group bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Mic className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {recordingState === "recording" && (
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={stopRecording}
                className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl bg-rose-500 hover:bg-rose-600 text-white"
              >
                <div className="absolute inset-0 rounded-full border-4 border-rose-500/30 animate-ping" />
                <MicOff className="w-8 h-8" />
              </button>
              <div className="flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-full border border-rose-200 mt-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-sm font-bold text-rose-700 tabular-nums">
                  <Clock className="w-3.5 h-3.5 inline mr-1" />
                  {formatDuration(duration)}
                </span>
              </div>
            </div>
          )}

          {recordingState === "processing" && (
            <div className="flex flex-col items-center gap-3">
              <button
                disabled
                className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-xl bg-blue-600 opacity-80 cursor-not-allowed"
              >
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </button>
            </div>
          )}

          {recordingState === "done" && (
            <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200 mt-4">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-bold text-emerald-700">AI berhasil</span>
            </div>
          )}
        </div>

        <div className="h-10 mt-6 flex items-center justify-center">
          {recordingState === "recording" && (
            <span className="text-rose-600 text-sm font-bold flex items-center gap-2 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-600" /> Mendengarkan...
            </span>
          )}
          {recordingState === "processing" && (
            <span className="text-blue-600 text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> AI sedang memproses...
            </span>
          )}
        </div>

        {aiError && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium max-w-[250px] text-center">
            {aiError}
          </div>
        )}
      </div>

      {/* Right Content: Manual Form */}
      <div className="flex-1 overflow-auto p-6 lg:p-8 bg-white">
        <div className="max-w-4xl mx-auto space-y-6">
      {/* Posko Info Badge */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 flex-shrink-0">
          <MapPin className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Posko Anda</p>
          <h2 className="text-lg font-black text-slate-800 truncate">{posko.name}</h2>
          {posko.alamat && (
            <p className="text-xs text-slate-500 truncate">{posko.alamat}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={cn(
            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
            posko.aiStatus === "MERAH" && "bg-red-50 text-red-700 border-red-200",
            posko.aiStatus === "KUNING" && "bg-amber-50 text-amber-700 border-amber-200",
            posko.aiStatus === "HIJAU" && "bg-emerald-50 text-emerald-700 border-emerald-200",
            !posko.aiStatus && "bg-slate-50 text-slate-500 border-slate-200",
          )}>
            {posko.aiStatus ?? "Belum Triase"}
          </div>
          {posko.aiUrgencyScore !== null && (
            <span className="text-[10px] font-bold text-slate-400">Skor: {posko.aiUrgencyScore}</span>
          )}
        </div>
      </div>

      {/* Editable Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <input type="hidden" {...register("poskoId")} />

        {/* Demografi Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Profil Pengungsi
            <span className="ml-auto bg-blue-50 px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 border border-blue-100">
              Total: {totalPengungsi} Jiwa
            </span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-500 mb-2">Pengungsi Total</label>
              <input
                type="number"
                {...register("jumlahPengungsi", { valueAsNumber: true })}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-lg font-black text-slate-800 shadow-sm outline-none transition-colors"
              />
              {errors.jumlahPengungsi && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.jumlahPengungsi.message}</p>}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-500 mb-2">Dewasa (Umum)</label>
              <input
                type="number"
                {...register("jumlahDewasa", { valueAsNumber: true })}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-lg font-black text-slate-800 shadow-sm outline-none transition-colors"
              />
              {errors.jumlahDewasa && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.jumlahDewasa.message}</p>}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-500 mb-2">Anak-anak</label>
              <input
                type="number"
                {...register("jumlahAnak", { valueAsNumber: true })}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-lg font-black text-slate-800 shadow-sm outline-none transition-colors"
              />
              {errors.jumlahAnak && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.jumlahAnak.message}</p>}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-500 mb-2">Lansia</label>
              <input
                type="number"
                {...register("jumlahLansia", { valueAsNumber: true })}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-lg font-black text-slate-800 shadow-sm outline-none transition-colors"
              />
              {errors.jumlahLansia && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.jumlahLansia.message}</p>}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <label className="block text-xs font-bold text-slate-500 mb-2">Balita</label>
              <input
                type="number"
                {...register("jumlahBalita", { valueAsNumber: true })}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-3 py-2 text-lg font-black text-slate-800 shadow-sm outline-none transition-colors"
              />
              {errors.jumlahBalita && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.jumlahBalita.message}</p>}
            </div>

            <div className="bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
              <label className="block text-xs font-bold text-purple-700 mb-2">Disabilitas</label>
              <input
                type="number"
                {...register("jumlahDisabilitas", { valueAsNumber: true })}
                className="w-full bg-white border border-purple-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-3 py-2 text-lg font-black text-purple-900 shadow-sm outline-none transition-colors"
              />
              {errors.jumlahDisabilitas && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.jumlahDisabilitas.message}</p>}
            </div>

            <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
              <label className="block text-xs font-bold text-orange-700 mb-2">Ibu Hamil</label>
              <input
                type="number"
                {...register("jumlahIbuHamil", { valueAsNumber: true })}
                className="w-full bg-white border border-orange-200 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-3 py-2 text-lg font-black text-orange-900 shadow-sm outline-none transition-colors"
              />
              {errors.jumlahIbuHamil && <p className="text-[10px] text-red-500 mt-1 font-semibold">{errors.jumlahIbuHamil.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
              Catatan Medis Darurat
            </label>
            <textarea
              {...register("catatanMedisDarurat")}
              className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-2xl px-4 py-3 text-sm min-h-[100px] shadow-sm leading-relaxed outline-none transition-colors resize-none"
              placeholder="Adakah penyakit menular, luka berat, atau kondisi darurat lainnya?"
            />
          </div>
        </div>

        {/* Kebutuhan Section */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              Permintaan Kebutuhan
              <span className="bg-amber-50 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-600 border border-amber-100">
                {watchedKebutuhan?.length ?? 0} item
              </span>
            </h3>
            <button
              type="button"
              onClick={() => append({ kategori: "MAKANAN", namaBarang: "", qtyNeeded: 1 })}
              className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Item
            </button>
          </div>

          {fields.length > 0 ? (
            <div className="space-y-3">
              {fields.map((field, index) => {
                const kategoriValue = watchedKebutuhan?.[index]?.kategori;
                const kategoriColor = KATEGORI_OPTIONS.find((k) => k.value === kategoriValue)?.color ?? "";

                return (
                  <div
                    key={field.id}
                    className="bg-slate-50 rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center"
                  >
                    <select
                      {...register(`kebutuhan.${index}.kategori`)}
                      className={cn(
                        "text-xs font-bold px-3 py-2 rounded-xl border outline-none transition-colors cursor-pointer",
                        kategoriColor || "bg-white border-slate-200"
                      )}
                    >
                      {KATEGORI_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    <input
                      type="text"
                      {...register(`kebutuhan.${index}.namaBarang`)}
                      placeholder="Nama barang..."
                      className="flex-1 min-w-0 bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none transition-colors"
                    />

                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        {...register(`kebutuhan.${index}.qtyNeeded`, { valueAsNumber: true })}
                        className="w-20 text-center bg-white border border-slate-200 focus:border-blue-500 rounded-xl px-2 py-2 text-sm font-black text-slate-800 outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Mic className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-400">
                Belum ada kebutuhan. Gunakan input suara atau tambahkan manual.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* <button
            type="button"
            onClick={resetForm}
            className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl text-sm font-bold text-slate-600 flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Reset
          </button> */}

          <button
            type="submit"
            disabled={saveStatus === "saving"}
            className={cn(
              "flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all",
              saveStatus === "saved"
                ? "bg-emerald-600 text-white shadow-[0_8px_24px_rgba(16,185,129,0.3)]"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-[0_8px_24px_rgba(37,99,235,0.3)] disabled:opacity-70 disabled:shadow-none"
            )}
          >
            {saveStatus === "saving" && (
              <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
            )}
            {saveStatus === "saved" && (
              <><CheckCircle2 className="w-5 h-5" /> Tersimpan</>
            )}
            {(saveStatus === "idle" || saveStatus === "error") && (
              <><Save className="w-5 h-5" /> Submit</>
            )}
          </button>
        </div>

        {saveStatus === "error" && saveError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 font-medium">
            {saveError}
          </div>
        )}
      </form>
        </div>
      </div>

      {/* Triage Result Modal */}
      {isTriageOpen && triageResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Background design accents */}
            <div className={cn(
              "absolute top-0 right-0 w-32 h-32 rounded-bl-full -z-0 opacity-15",
              triageResult.status === "MERAH" && "bg-red-500",
              triageResult.status === "KUNING" && "bg-amber-500",
              triageResult.status === "HIJAU" && "bg-emerald-500",
            )} />

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Icon */}
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border shadow-sm",
                triageResult.status === "MERAH" && "bg-red-50 border-red-100 text-red-600",
                triageResult.status === "KUNING" && "bg-amber-50 border-amber-100 text-amber-600",
                triageResult.status === "HIJAU" && "bg-emerald-50 border-emerald-100 text-emerald-600",
              )}>
                {triageResult.status === "MERAH" ? <AlertTriangle className="w-8 h-8 animate-bounce" /> : <CheckCircle2 className="w-8 h-8 text-emerald-600" />}
              </div>

              {/* Title */}
              <h3 className="text-xl font-black text-slate-800 mb-1">Triage AI Selesai</h3>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-6">Klasifikasi Urgensi Posko</p>

              {/* Status & Score */}
              <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 p-5 mb-6 flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Status Prioritas</span>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                    triageResult.status === "MERAH" && "bg-red-50 text-red-700 border-red-200",
                    triageResult.status === "KUNING" && "bg-amber-50 text-amber-700 border-amber-200",
                    triageResult.status === "HIJAU" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                  )}>
                    {triageResult.status}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                  <span className="text-xs font-bold text-slate-500">Skor Urgensi</span>
                  <div className="flex items-baseline gap-0.5">
                    <span className={cn(
                      "text-3xl font-black tabular-nums",
                      triageResult.status === "MERAH" && "text-red-600",
                      triageResult.status === "KUNING" && "text-amber-600",
                      triageResult.status === "HIJAU" && "text-emerald-600",
                    )}>
                      {triageResult.score}
                    </span>
                    <span className="text-xs font-bold text-slate-400">/ 100</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed mb-6">
                Data posko dan kebutuhan logistik berhasil disimpan ke database. AI telah mengklasifikasikan posko ini dengan prioritas <strong className={cn(
                  triageResult.status === "MERAH" && "text-red-700",
                  triageResult.status === "KUNING" && "text-amber-700",
                  triageResult.status === "HIJAU" && "text-emerald-700",
                )}>{triageResult.status}</strong>.
              </p>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsTriageOpen(false)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-lg transition-colors"
              >
                Tutup & Kembali
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
