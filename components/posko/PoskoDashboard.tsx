"use client";

import { useState } from "react";
import { PoskoHeader } from "./PoskoHeader";
import { SektorDemografi } from "./SektorDemografi";
import { SektorLogistik } from "./SektorLogistik";
import { SektorKedatangan } from "./SektorKedatangan";
import { TabNav } from "./TabNav";
import type { PoskoData, AiTriase } from "@/types/posko";

interface Props {
  data: PoskoData;
}

export function PoskoDashboard({ data }: Props) {
  const [triase, setTriase] = useState<AiTriase>(data.triase);

  return (
    <div className="min-h-screen bg-slate-50">
      <PoskoHeader
        namaPosko={data.namaPosko}
        alamat={data.alamat}
        triase={triase}
      />
      <TabNav />
      <main className="max-w-3xl mx-auto divide-y divide-slate-100/80">
        <SektorDemografi initialDemografi={data.demografi} />
        <SektorLogistik initialLogistik={data.logistik} />
        <SektorKedatangan initialKedatangan={data.kedatangan} />
      </main>

      {/* Bottom safe area for mobile */}
      <div className="h-8" />
    </div>
  );
}
