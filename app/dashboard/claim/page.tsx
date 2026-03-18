import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { claimStartup } from "@/app/actions/claim";
import Link from "next/link";
import { CheckCircle, AlertCircle, Briefcase } from "lucide-react";

export default async function ClaimPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
    const params = await searchParams;
    const token = params.token;

    if (!token) {
        redirect("/");
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    // If they are not logged in, show a prompt to log in and come back
    if (!session) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
                <Briefcase size={48} className="text-zinc-400 mb-6" />
                <h1 className="text-2xl font-bold text-zinc-900 mb-2">Claim your startup listing</h1>
                <p className="text-zinc-600 mb-8 max-w-md">
                    You need to create an account or sign in to link this startup to your profile.
                </p>
                <div className="flex gap-4">
                    <Link href={`/login?next=/claim?token=${token}`} className="btn btn-primary">
                        Sign In or Sign Up
                    </Link>
                </div>
            </div>
        );
    }

    // Attempt to claim it
    const result = await claimStartup(token);

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
            {result.success ? (
                <>
                    <CheckCircle size={64} className="text-emerald-500 mb-6" />
                    <h1 className="text-2xl font-bold text-zinc-900 mb-2">Startup Claimed Successfully!</h1>
                    <p className="text-zinc-600 mb-8 max-w-sm">
                        The startup has been added to your dashboard. You can now manage it directly.
                    </p>
                    <div className="flex gap-4">
                        <Link href="/dashboard" className="btn btn-primary">
                            Go to Dashboard
                        </Link>
                        <Link href={`/startup/${result.startupId}`} className="btn btn-secondary">
                            View public listing
                        </Link>
                    </div>
                </>
            ) : (
                <>
                    <AlertCircle size={64} className="text-red-500 mb-6" />
                    <h1 className="text-2xl font-bold text-zinc-900 mb-2">Failed to claim startup</h1>
                    <p className="text-zinc-600 mb-8 max-w-sm">
                        {result.error || "The link may be expired, invalid, or the startup has already been claimed."}
                    </p>
                    <Link href="/" className="btn btn-secondary">
                        Return home
                    </Link>
                </>
            )}
        </div>
    );
}
