"use client";

import { authService } from "@/services/auth.service";

interface GoogleAuthButtonProps {
  mode: "login" | "signup";
  requestedRole?: string;
}

export function GoogleAuthButton({ mode, requestedRole }: GoogleAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={() => authService.loginWithGoogle(requestedRole)}
      className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm font-bold text-navy-800 shadow-sm hover:bg-ink-50 active:scale-[0.98] transition-all cursor-pointer"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
        <g transform="matrix(1, 0, 0, 1, 0, 0)">
          <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.97,2.37 -2.07,3.1l3.2,2.48c1.88,-1.73 2.97,-4.27 2.97,-7.18c0,-0.6 -0.05,-1.2 -0.13,-1.7Z" fill="#4285F4" />
          <path d="M12,20.4c2.27,0 4.18,-0.75 5.57,-2.02l-3.2,-2.48c-0.89,0.6 -2.03,0.95 -3.37,0.95c-2.59,0 -4.79,-1.75 -5.57,-4.1l-3.3,2.56c1.64,3.25 5,5.49 8.87,5.49Z" fill="#34A853" />
          <path d="M6.43,12.75c-0.2,-0.6 -0.31,-1.24 -0.31,-1.9c0,-0.66 0.11,-1.3 0.31,-1.9l-3.3,-2.56c-0.65,1.3 -1.02,2.77 -1.02,4.46c0,1.69 0.37,3.16 1.02,4.46l3.3,-2.56Z" fill="#FBBC05" />
          <path d="M12,5.2c1.47,0 2.79,0.5 3.83,1.49l2.87,-2.87c-1.74,-1.62 -4.01,-2.62 -6.7,-2.62c-3.87,0 -7.23,2.24 -8.87,5.49l3.3,2.56c0.78,-2.35 2.98,-4.1 5.57,-4.1Z" fill="#EA4335" />
        </g>
      </svg>
      {mode === "login" ? "Sign in with Google" : "Sign up with Google"}
    </button>
  );
}
