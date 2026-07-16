"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminProfileValues, AdminCommunityValues, AdminInventoryValues, AdminOnboardingValues } from "@/schemas/onboarding";
import { onboardingService } from "@/services/onboarding.service";
import { StepProfile } from "./StepProfile";
import { StepCommunity } from "./StepCommunity";
import { StepInventory } from "./StepInventory";

type WizardStep = 1 | 2 | 3;

type PartialWizardData = Partial<AdminProfileValues> &
  Partial<AdminCommunityValues> &
  Partial<AdminInventoryValues>;

const STEP_LABELS = ["Profil", "Komunitas", "Gudang"];

export function AdminOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>(1);
  const [data, setData] = useState<PartialWizardData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProfileNext = (values: AdminProfileValues) => {
    setData((prev) => ({ ...prev, ...values }));
    setStep(2);
  };

  const handleCommunityNext = (values: AdminCommunityValues) => {
    setData((prev) => ({ ...prev, ...values }));
    setStep(3);
  };

  const handleInventorySubmit = async (values: AdminInventoryValues) => {
    const payload = { ...data, ...values } as AdminOnboardingValues;
    setIsLoading(true);
    setError(null);
    const result = await onboardingService.submitAdminOnboarding(payload);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error ?? "Terjadi kesalahan");
      return;
    }
    router.push("/dashboard/super-admin");
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-ink-100 p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-navy-800">Setup Komunitas</h1>
        <p className="text-ink-500 mt-1 text-sm">Lengkapi data berikut untuk mengaktifkan komunitas Anda.</p>

        <div className="flex items-center gap-2 mt-6">
          {STEP_LABELS.map((label, idx) => {
            const stepNum = (idx + 1) as WizardStep;
            const isActive = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className="flex items-center gap-2">
                  <div
                    className={[
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                      isActive ? "bg-navy-800 text-white" : isDone ? "bg-emerald-500 text-white" : "bg-ink-100 text-ink-400",
                    ].join(" ")}
                  >
                    {isDone ? (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className={[
                      "text-xs font-medium",
                      isActive ? "text-navy-800" : isDone ? "text-emerald-600" : "text-ink-400",
                    ].join(" ")}
                  >
                    {label}
                  </span>
                </div>
                {idx < STEP_LABELS.length - 1 && (
                  <div className={["h-px flex-1 mx-1", isDone ? "bg-emerald-300" : "bg-ink-100"].join(" ")} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {step === 1 && (
        <StepProfile
          defaultValues={data}
          onNext={handleProfileNext}
        />
      )}
      {step === 2 && (
        <StepCommunity
          defaultValues={data}
          onNext={handleCommunityNext}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <StepInventory
          defaultValues={data}
          onSubmit={handleInventorySubmit}
          onBack={() => setStep(2)}
          isLoading={isLoading}
        />
      )}

      {error && (
        <p className="mt-4 text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3">{error}</p>
      )}
    </div>
  );
}
