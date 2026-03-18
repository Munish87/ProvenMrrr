import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";
import { cookies } from "next/headers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    let avatarUrl: string | null = null;
    const { data: profileData } = await supabase.from("users").select("avatar_url").eq("id", user.id).returns<{ avatar_url: string | null }[]>().single();
    if (profileData) avatarUrl = profileData.avatar_url;

    const cookieStore = await cookies();
    const role = (cookieStore.get("dashboard_role")?.value as "buyer" | "seller") || "seller";

    return (
        <div style={{ minHeight: "100vh", display: "flex", backgroundColor: "var(--color-bg)" }}>
            <Sidebar userEmail={user.email} avatarUrl={avatarUrl} role={role} />

            {/* Main */}
            <main style={{ marginLeft: 220, flex: 1, padding: 32, minHeight: "100vh" }}>
                {children}
            </main>
        </div>
    );
}
