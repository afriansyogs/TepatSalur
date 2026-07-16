import { Suspense } from "react";
import { RelawanOnboardingForm } from "@/components/onboarding/RelawanOnboardingForm";

export const metadata = {
  title: "Lengkapi Profil Relawan - TepatSalur",
};

export default function RelawanOnboardingPage() {
  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <Suspense>
          <RelawanOnboardingForm />
        </Suspense>
      </div>
    </main>
  );
}
