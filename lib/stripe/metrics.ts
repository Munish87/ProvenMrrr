import type { RawStripeData } from "./fetcher";

export interface ComputedMetrics {
    mrr: number;
    arr: number;
    allTimeRevenue: number; // Sum of all historical succeeded charge amounts
    momGrowthRate: number; // month-over-month % change
    churnRate: number; // monthly % of subscriptions cancelled
    refundRate: number; // refunds / invoices paid (by amount)
    customerCount: number;
    volatilityScore: number; // 0–100, lower = more stable
    revenueByMonth: { month: string; revenue: number; date: string; }[]; // historical payload for chart
}

/**
 * Computes all revenue metrics from raw Stripe data.
 * All monetary values in USD cents divided to dollars.
 */
export function computeMetrics(data: RawStripeData): ComputedMetrics {
    const { subscriptions, charges } = data;

    // ─── MRR ────────────────────────────────────────────────────────────────────
    // Sum active subscription amounts based on strict interval evaluations (normalized to monthly)
    const mrr = subscriptions.reduce((sum, sub) => {
        if (sub.status !== "active" && sub.status !== "trialing") return sum;
        if (!sub.items?.data?.length || !sub.items.data[0].price) return sum;

        const priceCents = sub.items.data[0].price.unit_amount || 0;
        const interval = sub.items.data[0].price.recurring?.interval;

        let subMrr = 0;
        if (interval === "month") {
            subMrr = priceCents;
        } else if (interval === "year") {
            subMrr = priceCents / 12;
        } else if (interval === "week") {
            subMrr = priceCents * 4.33;
        } else if (interval === "day") {
            subMrr = priceCents * 30;
        }

        return sum + (subMrr / 100); // cents -> dollars
    }, 0);

    const arr = mrr * 12;

    // ─── CHURN ──────────────────────────────────────────────────────────────────
    const now = Math.floor(Date.now() / 1000);
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60;

    const cancelledThisMonth = subscriptions.filter(
        (s) =>
            s.status === "canceled" &&
            s.canceled_at &&
            s.canceled_at >= thirtyDaysAgo
    ).length;

    const totalAtStartOfMonth = subscriptions.filter(
        (s) =>
            s.created <= thirtyDaysAgo &&
            (s.status === "active" ||
                (s.status === "canceled" &&
                    s.canceled_at &&
                    s.canceled_at >= thirtyDaysAgo))
    ).length;

    const churnRate =
        totalAtStartOfMonth > 0
            ? (cancelledThisMonth / totalAtStartOfMonth) * 100
            : 0;

    // ─── MONTH-OVER-MONTH GROWTH & ALL TIME REVENUE ───────────────────────────────
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60;

    const allTimeRevenue = charges
        .filter((c) => c.status === "succeeded")
        .reduce((sum, c) => sum + (c.amount ?? 0) / 100, 0);

    const lastMonthRevenue = charges
        .filter(
            (c) =>
                c.status === "succeeded" &&
                c.created >= sixtyDaysAgo &&
                c.created < thirtyDaysAgo
        )
        .reduce((sum, c) => sum + (c.amount ?? 0) / 100, 0);

    const thisMonthRevenue = charges
        .filter(
            (c) => c.status === "succeeded" && c.created >= thirtyDaysAgo
        )
        .reduce((sum, c) => sum + (c.amount ?? 0) / 100, 0);

    const momGrowthRate =
        lastMonthRevenue > 0
            ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : thisMonthRevenue > 0
                ? 100
                : 0;

    // ─── REFUND RATE ────────────────────────────────────────────────────────────
    const totalChargeAmount = charges.reduce(
        (sum, c) => sum + (c.amount ?? 0) / 100,
        0
    );
    const totalRefundAmount = charges
        .filter((c) => c.refunded || c.amount_refunded > 0)
        .reduce((sum, c) => sum + (c.amount_refunded || 0) / 100, 0);

    const refundRate =
        totalChargeAmount > 0
            ? (totalRefundAmount / totalChargeAmount) * 100
            : 0;

    // ─── CUSTOMER COUNT ─────────────────────────────────────────────────────────
    const uniqueCustomers = new Set();
    for (const sub of subscriptions) {
        if (sub.customer) {
            uniqueCustomers.add(typeof sub.customer === "string" ? sub.customer : sub.customer.id);
        }
    }
    const customerCount = uniqueCustomers.size;

    // ─── VOLATILITY: coefficient of variation of monthly revenue ────────────────
    const revenueByMonth = buildMonthlyRevenue(charges);
    const mrrValues = revenueByMonth.map((m) => m.revenue);
    const volatilityScore = computeVolatility(mrrValues);

    return {
        mrr,
        arr,
        allTimeRevenue,
        momGrowthRate,
        churnRate,
        refundRate,
        customerCount,
        volatilityScore,
        revenueByMonth,
    };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildMonthlyRevenue(
    charges: RawStripeData["charges"]
): { month: string; revenue: number; date: string }[] {
    const aggregated: Record<string, number> = {};
    const dateMapping: Record<string, string> = {};

    const sortedCharges = [...charges].sort((a, b) => a.created - b.created);

    sortedCharges.forEach((charge) => {
        if (charge.status !== "succeeded") return;

        const d = new Date(charge.created * 1000);
        const label = d.toLocaleString("en-US", { month: "short" });
        const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

        if (aggregated[label] === undefined) {
            aggregated[label] = 0;
            dateMapping[label] = dateString;
        }

        const amount = charge.amount / 100;
        aggregated[label] += amount;
    });

    const result: { month: string; revenue: number; date: string }[] = [];
    for (const [month, revenue] of Object.entries(aggregated)) {
        result.push({ month, revenue, date: dateMapping[month] });
    }

    if (result.length === 0) {
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = d.toLocaleString("en-US", { month: "short" });
            result.push({ month: label, revenue: 0, date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01` });
        }
    }

    return result;
}

/**
 * Volatility = coefficient of variation (StdDev / Mean) * 100, capped at 100.
 * Lower = more stable.
 */
function computeVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    if (mean === 0) return 0;
    const variance =
        values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return Math.min((stdDev / mean) * 100, 100);
}
