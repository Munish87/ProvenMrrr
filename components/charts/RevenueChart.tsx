"use client";

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface DataPoint { month: string; revenue: number; }
interface Props { data: DataPoint[]; label?: string; }

function formatK(v: number) {
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
    return `$${v}`;
}

export function RevenueChart({ data, label = "Revenue" }: Props) {
    return (
        <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data} margin={{ top: 20, right: 10, bottom: 5, left: 0 }}>
                <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.3} />
                <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "var(--color-secondary)", fontSize: 11, fontWeight: 500 }}
                    dy={10}
                />
                <YAxis 
                    tickFormatter={formatK} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "var(--color-secondary)", fontSize: 11, fontWeight: 500 }}
                />
                <Tooltip 
                    contentStyle={{ background: "var(--color-surface-strong)", border: "1px solid var(--color-border)", borderRadius: 12, fontSize: 12, boxShadow: "var(--shadow-card)", color: "var(--color-text)", padding: "12px" }}
                    labelStyle={{ color: "var(--color-secondary)", marginBottom: "4px", fontWeight: 600 }}
                    itemStyle={{ color: "var(--color-text)", fontWeight: 700 }}
                    formatter={(value: unknown) => [`$${(value as number).toLocaleString()}`, label]}
                />
                <Area 
                    type="linear" 
                    dataKey="revenue" 
                    stroke="#4F46E5" 
                    strokeWidth={3} 
                    fill="url(#revenueGrad)" 
                    dot={false}
                    activeDot={{ r: 6, stroke: "#4F46E5", strokeWidth: 2, fill: "var(--color-surface)" }}
                    filter="url(#glow)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
