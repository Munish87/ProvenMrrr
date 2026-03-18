import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "./Sidebar";
import { cookies } from "next/headers";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    let avatarUrl: string | null = null;
    let userName: string | null = null;
    const { data: profileData } = await supabase.from("users").select("name, avatar_url").eq("id", user.id).single();
    if (profileData) {
        avatarUrl = profileData.avatar_url;
        userName = profileData.name;
    }

    const cookieStore = await cookies();
    const role = (cookieStore.get("dashboard_role")?.value as "buyer" | "seller") || "seller";

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                background: "transparent",
                position: "relative",
            }}
        >
            <Sidebar userEmail={user.email} userName={userName} avatarUrl={avatarUrl} role={role} />

            <main
                style={{
                    marginLeft: 260,
                    flex: 1,
                    padding: "24px 32px",
                    minHeight: "100vh",
                    overflowX: "hidden",
                    position: "relative",
                }}
            >
                {children}
            </main>
        </div>
    );
}
