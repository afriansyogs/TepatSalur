import { AdminOnboardingWizard } from "@/components/onboarding/AdminOnboardingWizard";

export const metadata = {
  title: "Setup Komunitas - TepatSalur",
};

export default function AdminOnboardingPage() {
  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <AdminOnboardingWizard />
      </div>
    </main>
  );
}
