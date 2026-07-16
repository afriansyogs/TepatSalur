import { Suspense } from "react";
import { AuthSidebar } from "@/components/auth/AuthSidebar";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen bg-paper">
      <div className="relative hidden min-h-screen lg:block lg:w-[45%] xl:w-[55%] 2xl:w-[60%]">
        <div className="sticky top-0 h-screen">
          <AuthSidebar />
        </div>
      </div>
      <div className="flex min-h-screen w-full items-center justify-center px-6 py-12 lg:w-[55%] xl:w-[45%] 2xl:w-[40%]">
        <div className="w-full max-w-sm">
          <Suspense>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
