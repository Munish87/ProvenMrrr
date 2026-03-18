import { ShieldCheck } from "lucide-react";

interface VerifiedBadgeProps {
    className?: string;
    isVerified?: boolean;
}

export function VerifiedBadge({ className = "", isVerified = false }: VerifiedBadgeProps) {
    if (isVerified) {
        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 ${className}`}
                title="Revenue verified via Stripe connection"
            >
                <ShieldCheck size={12} />
                Verified Revenue
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-400/10 text-slate-400 border border-slate-400/20 ${className}`}
            title="Revenue not verified"
        >
            Revenue not verified
        </span>
    );
}
