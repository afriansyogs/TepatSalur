import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { UserRole, UserStatus } from "@/types/auth";

const ROLE_DASHBOARD: Record<UserRole, string> = {
  SUPER_ADMIN: "/dashboard/super-admin",
  RELAWAN: "/dashboard/relawan",
  DONATUR: "/dashboard/donatur/buat-donasi",
};

const ROLE_ONBOARDING: Record<UserRole, string> = {
  SUPER_ADMIN: "/onboarding/admin",
  RELAWAN: "/onboarding/relawan",
  DONATUR: "",
};

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isPendingRoute = pathname.startsWith("/relawan/pending-approval");

  if (!user && (isDashboardRoute || isOnboardingRoute || isPendingRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: userRow } = await supabase
      .from("users")
      .select("role, status, community_id")
      .eq("id", user.id)
      .single();

    const role = userRow?.role as UserRole | undefined;
    const status = userRow?.status as UserStatus | undefined;

    const { data: profileRow } = await supabase
      .from("user_profiles")
      .select("is_completed")
      .eq("user_id", user.id)
      .single();

    const isCompleted = profileRow?.is_completed ?? false;

    const redirect = (path: string) => {
      const url = request.nextUrl.clone();
      url.pathname = path;
      return NextResponse.redirect(url);
    };

    if (!role) return supabaseResponse;

    if (isAuthRoute) {
      return redirect(ROLE_DASHBOARD[role]);
    }

    if (!isCompleted && isDashboardRoute) {
      const onboardingPath = ROLE_ONBOARDING[role];
      if (onboardingPath) return redirect(onboardingPath);
    }

    if (isCompleted && isOnboardingRoute) {
      return redirect(ROLE_DASHBOARD[role]);
    }

    if (role === "RELAWAN" && status === "PENDING" && isDashboardRoute) {
      return redirect("/relawan/pending-approval");
    }

    if (role === "RELAWAN" && status === "ACTIVE" && isPendingRoute) {
      return redirect(ROLE_DASHBOARD["RELAWAN"]);
    }
  }

  return supabaseResponse;
};
