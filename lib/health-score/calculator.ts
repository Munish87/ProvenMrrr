import type { ComputedMetrics } from "../stripe/metrics";

export type RiskLevel = "low" | "medium" | "high";

export interface HealthScoreResult {
    score: number; // 0–100
    riskLevel: RiskLevel;
    breakdown: {
        revenueStability: number; // 0–30
        growthRate: number; // 0–25
        churnScore: number; // 0–25
        customerDiversification: number; // 0–10
        refundScore: number; // 0–10
    };
    aiSummary: string;
}

/**
 * Calculates a 0–100 health score from computed Stripe metrics.
 *
 * Weights:
 *   Revenue stability       30%
 *   Growth rate             25%
 *   Churn (inverse)         25%
 *   Customer diversif.      10%
 *   Refund rate (inverse)   10%
 */
export function calculateHealthScore(
    metrics: ComputedMetrics
): HealthScoreResult {
    // ─── 1. Revenue Stability (0–30) ────────────────────────────────────────────
    // Lower volatility = higher score. Volatility is 0–100.
    const revenueStability = 30 * (1 - metrics.volatilityScore / 100);

    // ─── 2. Growth Rate (0–25) ──────────────────────────────────────────────────
    // Clamp growth rate: -100% to +100%
    // -100% maps to 0, 0% maps to ~10, +100% maps to 25
    const growthClamped = Math.max(-100, Math.min(100, metrics.momGrowthRate));
    const growthRate = 25 * ((growthClamped + 100) / 200);

    // ─── 3. Churn Score (0–25, inverse) ─────────────────────────────────────────
    // 0% churn → 25 pts | 10%+ churn → 0 pts
    const churnClamped = Math.max(0, Math.min(10, metrics.churnRate));
    const churnScore = 25 * (1 - churnClamped / 10);

    // ─── 4. Customer Diversification (0–10) ─────────────────────────────────────
    // More customers = more resilient. Cap at 100 customers for full score.
    const customerDiversification = Math.min(10, (metrics.customerCount / 100) * 10);

    // ─── 5. Refund Score (0–10, inverse) ────────────────────────────────────────
    // 0% refunds → 10 pts | 15%+ refunds → 0 pts
    const refundClamped = Math.max(0, Math.min(15, metrics.refundRate));
    const refundScore = 10 * (1 - refundClamped / 15);

    const rawScore =
        revenueStability +
        growthRate +
        churnScore +
        customerDiversification +
        refundScore;

    const score = Math.round(Math.max(0, Math.min(100, rawScore)));

    const riskLevel: RiskLevel =
        score >= 70 ? "low" : score >= 40 ? "medium" : "high";

    // ─── AI Summary (placeholder — swap for OpenAI/Claude in prod) ──────────────
    const aiSummary = generateAiSummary(score, riskLevel, metrics);

    return {
        score,
        riskLevel,
        breakdown: {
            revenueStability: Math.round(revenueStability * 10) / 10,
            growthRate: Math.round(growthRate * 10) / 10,
            churnScore: Math.round(churnScore * 10) / 10,
            customerDiversification: Math.round(customerDiversification * 10) / 10,
            refundScore: Math.round(refundScore * 10) / 10,
        },
        aiSummary,
    };
}

function generateAiSummary(
    score: number,
    riskLevel: RiskLevel,
    m: ComputedMetrics
): string {
    const mrrFmt = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(m.mrr);

    const growthDir = m.momGrowthRate >= 0 ? "up" : "down";
    const growthAbs = Math.abs(m.momGrowthRate).toFixed(1);

    const riskDesc = {
        low: "strong fundamentals with consistent revenue and healthy growth",
        medium:
            "moderate stability with some areas needing improvement",
        high: "significant risk factors that require immediate attention",
    }[riskLevel];

    const churnComment =
        m.churnRate < 2
            ? "Churn is exceptionally low, indicating strong product-market fit."
            : m.churnRate < 5
                ? "Churn is within an acceptable range."
                : "Churn is elevated and should be a focus area for retention strategy.";

    return (
        `This startup has a ProvenMRR Health Score of ${score}/100, reflecting ${riskDesc}. ` +
        `Monthly Recurring Revenue stands at ${mrrFmt}, trending ${growthDir} ${growthAbs}% month-over-month. ` +
        `${churnComment} ` +
        `With ${m.customerCount} active customers and a revenue volatility index of ${m.volatilityScore.toFixed(1)}, ` +
        `the business ${score >= 70 ? "demonstrates investor-grade predictability" : score >= 40 ? "shows potential with room for improvement" : "faces challenges that should be addressed before scaling"}. ` +
        `[AI insights powered by ProvenMRR — advanced analysis available in Premium]`
    );
}
