"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RelawanIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/relawan/manajemen-posko");
  }, [router]);

  return null;
}
