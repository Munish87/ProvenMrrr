import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "USD"): string {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(amount);
}

export function formatPercent(value: number, decimals = 1): string {
    return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

export function getRiskColor(riskLevel: "low" | "medium" | "high") {
    return {
        low: "text-emerald-400",
        medium: "text-amber-400",
        high: "text-rose-400",
    }[riskLevel];
}

export function getScoreColor(score: number) {
    if (score >= 70) return "#10b981"; // emerald
    if (score >= 40) return "#f59e0b"; // amber
    return "#f43f5e"; // rose
}

export function getRiskLabel(score: number): "low" | "medium" | "high" {
    if (score >= 70) return "low";
    if (score >= 40) return "medium";
    return "high";
}
