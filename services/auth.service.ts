import { createClient } from "@/lib/supabase/client";
import { SignUpFormValues, LoginFormValues } from "@/schemas/auth";
import { User, UserRole, UserStatus } from "@/types/auth";

export const authService = {
  async signup(
    values: SignUpFormValues
  ): Promise<{ success: boolean; role?: UserRole; userId?: string; error?: string }> {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: { success: boolean; role?: UserRole; userId?: string; error?: string } =
        await res.json();

      if (!data.success) return data;

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (signInError) {
        return { success: false, error: signInError.message };
      }

      return { success: true, role: data.role, userId: data.userId };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup gagal";
      return { success: false, error: message };
    }
  },

  async login(
    values: LoginFormValues
  ): Promise<{ success: boolean; session?: unknown; error?: string }> {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: { success: boolean; session?: unknown; error?: string } = await res.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login gagal";
      return { success: false, error: message };
    }
  },

  async forgotPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: { success: boolean; error?: string } = await res.json();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Forgot password gagal";
      return { success: false, error: message };
    }
  },

  loginWithGoogle(requestedRole?: string): void {
    if (typeof window !== "undefined") {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/api/auth/callback`;

      supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: requestedRole ? { requested_role: requestedRole } : undefined,
        },
      });
    }
  },

  async logout(): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<User | null> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("users")
      .select("id, name, email, phone, role, status, community_id, avatar_url, created_at")
      .eq("id", user.id)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      name: profile.name ?? "",
      email: profile.email ?? "",
      phone: profile.phone ?? null,
      role: profile.role as UserRole,
      status: profile.status as UserStatus,
      communityId: profile.community_id ?? null,
      avatarUrl: profile.avatar_url ?? null,
      createdAt: profile.created_at ?? "",
    };
  },
};
