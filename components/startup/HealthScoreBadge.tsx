"use client";

import { getScoreColor } from "@/lib/utils";

interface HealthScoreBadgeProps {
    score: number;
    size?: "sm" | "md" | "lg";
}

const sizes = {
    sm: { outer: 56, stroke: 6, fontSize: "text-sm" },
    md: { outer: 80, stroke: 8, fontSize: "text-xl" },
    lg: { outer: 120, stroke: 10, fontSize: "text-3xl" },
};

export function HealthScoreBadge({ score, size = "md" }: HealthScoreBadgeProps) {
    const { outer, stroke, fontSize } = sizes[size];
    const radius = (outer - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = circumference - (score / 100) * circumference;
    const color = getScoreColor(score);

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: outer, height: outer }}>
            <svg width={outer} height={outer} className="-rotate-90" viewBox={`0 0 ${outer} ${outer}`}>
                {/* Background ring */}
                <circle
                    cx={outer / 2}
                    cy={outer / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={stroke}
                />
                {/* Progress ring */}
                <circle
                    cx={outer / 2}
                    cy={outer / 2}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={progress}
                    style={{
                        transition: "stroke-dashoffset 0.8s ease",
                        filter: `drop-shadow(0 0 6px ${color}88)`,
                    }}
                />
            </svg>
            <span
                className={`absolute font-bold ${fontSize}`}
                style={{ color }}
            >
                {score}
            </span>
        </div>
    );
}
