"use client";

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface DataPoint { month: string; revenue: number; }
interface Props { data: DataPoint[]; }

function formatK(v: number) {
    if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
    return `$${v}`;
}

export function RevenueChart({ data }: Props) {
    return (
        <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={formatK} tick={{ fontSize: 11, fill: "#999" }} axisLine={false} tickLine={false} width={45} />
                <Tooltip
                    contentStyle={{ background: "#fff", border: "1px solid #eaeaea", borderRadius: 8, fontSize: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
                    formatter={(value: unknown) => [`$${(value as number).toLocaleString()}`, "Revenue"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
}
