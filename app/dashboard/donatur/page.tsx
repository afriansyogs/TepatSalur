"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DonaturIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/donatur/buat-donasi");
  }, [router]);

  return null;
}
