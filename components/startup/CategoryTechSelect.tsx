"use client";

import React, { useState, useId } from "react";
import Select, { StylesConfig } from "react-select";
import {
    BarChart2, Sparkles, MessageCircle, Video, Bitcoin, Headphones, PenTool, Code,
    ShoppingBag, GraduationCap, Film, CreditCard, Gamepad2, Leaf, HeartPulse, Cpu,
    Scale, Megaphone, Store, Smartphone, Newspaper, Blocks, CheckCircle, Home,
    Users, Cloud, Briefcase, Shield, Share2, Plane, Wrench, Package
} from "lucide-react";

const CATEGORY_OPTIONS = [
    { value: "Analytics", label: "Analytics", desc: "Data analysis, dashboards, and business intelligence.", icon: BarChart2 },
    { value: "Artificial Intelligence", label: "Artificial Intelligence", desc: "AI-powered tools, LLMs, and machine learning applications.", icon: Sparkles },
    { value: "Community", label: "Community", desc: "Forums, groups, and community management.", icon: MessageCircle },
    { value: "Content Creation", label: "Content Creation", desc: "Tools for creators, video editing, podcasting, and writing.", icon: Video },
    { value: "Crypto & Web3", label: "Crypto & Web3", desc: "Cryptocurrency, blockchain, NFTs, and decentralized apps.", icon: Bitcoin },
    { value: "Customer Support", label: "Customer Support", desc: "Help desk, chatbots, and customer service platforms.", icon: Headphones },
    { value: "Design", label: "Design", desc: "Tools for graphic design, UI/UX, and creative software.", icon: PenTool },
    { value: "Developer Tools", label: "Developer Tools", desc: "Tools for software engineers, DevOps, and API services.", icon: Code },
    { value: "E-commerce", label: "E-commerce", desc: "Online stores, marketplaces, and dropshipping tools.", icon: ShoppingBag },
    { value: "Education", label: "Education", desc: "EdTech, online courses, and learning platforms.", icon: GraduationCap },
    { value: "Entertainment", label: "Entertainment", desc: "Streaming, movies, music, and leisure apps.", icon: Film },
    { value: "Fintech", label: "Fintech", desc: "Financial technology, banking, payments, and investing.", icon: CreditCard },
    { value: "Games", label: "Games", desc: "Video games, esports, and gaming platforms.", icon: Gamepad2 },
    { value: "Green Tech", label: "Green Tech", desc: "Sustainability, renewable energy, and climate tech.", icon: Leaf },
    { value: "Health & Fitness", label: "Health & Fitness", desc: "Wellness, medical tech, workout apps, and mental health.", icon: HeartPulse },
    { value: "IoT & Hardware", label: "IoT & Hardware", desc: "Internet of Things, wearables, and physical tech products.", icon: Cpu },
    { value: "Legal", label: "Legal", desc: "Legal tech, contracts, and compliance services.", icon: Scale },
    { value: "Marketing", label: "Marketing", desc: "Advertising, SEO, email marketing, and social media tools.", icon: Megaphone },
    { value: "Marketplace", label: "Marketplace", desc: "Platforms connecting buyers and sellers.", icon: Store },
    { value: "Mobile Apps", label: "Mobile Apps", desc: "iOS and Android applications for smartphones and tablets.", icon: Smartphone },
    { value: "News & Magazines", label: "News & Magazines", desc: "Journalism, newsletters, and information aggregators.", icon: Newspaper },
    { value: "No-Code", label: "No-Code", desc: "Build software and websites without writing code.", icon: Blocks },
    { value: "Productivity", label: "Productivity", desc: "Tools to increase efficiency, task management, and workflow.", icon: CheckCircle },
    { value: "Real Estate", label: "Real Estate", desc: "Property management, housing markets, and PropTech.", icon: Home },
    { value: "Recruiting & HR", label: "Recruiting & HR", desc: "Hiring, talent acquisition, and human resources.", icon: Users },
    { value: "SaaS", label: "SaaS", desc: "Software as a Service platforms for businesses and consumers.", icon: Cloud },
    { value: "Sales", label: "Sales", desc: "CRM, lead generation, and sales enablement tools.", icon: Briefcase },
    { value: "Security", label: "Security", desc: "Cybersecurity, privacy, and identity management.", icon: Shield },
    { value: "Social Media", label: "Social Media", desc: "Social networking, community building, and content sharing.", icon: Share2 },
    { value: "Travel", label: "Travel", desc: "Travel booking, guides, and hospitality technology.", icon: Plane },
    { value: "Utilities", label: "Utilities", desc: "Useful tools, calculators, and converters.", icon: Wrench }
];
import { TECH_STACK_OPTIONS } from "@/lib/constants";
const customStyles: StylesConfig<any, boolean> = {
    control: (base, state) => ({
        ...base,
        minHeight: "44px",
        borderRadius: "12px",
        border: state.isFocused ? "1px solid var(--field-input-focus-border)" : "1px solid var(--field-input-border)",
        boxShadow: state.isFocused ? "var(--field-input-focus-shadow)" : "var(--field-input-shadow)",
        "&:hover": {
            border: state.isFocused ? "1px solid var(--field-input-focus-border)" : "1px solid var(--field-input-hover-border)"
        },
        padding: "0 4px",
        cursor: "pointer",
        background: "var(--field-input-bg)"
    }),
    valueContainer: (base) => ({
        ...base,
        padding: "2px 8px"
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: "color-mix(in srgb, var(--color-accent) 16%, var(--color-surface))",
        borderRadius: "8px",
        padding: "2px",
        fontSize: "13px",
        border: "1px solid color-mix(in srgb, var(--color-accent) 24%, var(--color-border))"
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: "var(--color-text)",
        fontWeight: 600
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: "var(--color-secondary)",
        "&:hover": {
            backgroundColor: "color-mix(in srgb, var(--color-accent) 10%, transparent)",
            color: "var(--color-text)",
            borderRadius: "4px"
        }
    }),
    placeholder: (base) => ({
        ...base,
        color: "var(--placeholder-color)",
        fontSize: "14px"
    }),
    singleValue: (base) => ({
        ...base,
        fontSize: "14px",
        color: "var(--color-text)"
    }),
    input: (base) => ({
        ...base,
        color: "var(--color-text)"
    }),
    menu: (base) => ({
        ...base,
        borderRadius: "16px",
        boxShadow: "var(--shadow-card)",
        border: "1px solid var(--field-input-border)",
        overflow: "hidden",
        zIndex: 50,
        background: "var(--color-surface-strong)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)"
    }),
    menuList: (base) => ({
        ...base,
        background: "transparent"
    }),
    option: (base, state) => ({
        ...base,
        cursor: "pointer",
        color: "var(--color-text)",
        backgroundColor: state.isSelected ? "color-mix(in srgb, var(--color-accent) 18%, var(--color-surface))" : state.isFocused ? "color-mix(in srgb, var(--color-accent) 8%, var(--color-surface))" : "transparent",
        "&:active": {
            backgroundColor: "color-mix(in srgb, var(--color-accent) 12%, var(--color-surface))"
        },
        padding: "10px 16px",
        transition: "all 0.1s"
    }),
    indicatorSeparator: (base) => ({
        ...base,
        backgroundColor: "var(--color-border)"
    }),
    dropdownIndicator: (base) => ({
        ...base,
        color: "var(--color-secondary)",
        "&:hover": {
            color: "var(--color-text)"
        }
    }),
    clearIndicator: (base) => ({
        ...base,
        color: "var(--color-secondary)",
        "&:hover": {
            color: "var(--color-text)"
        }
    })
};

// Custom component to format the single category value with an icon
const formatOptionLabel = ({ label, value, desc, icon: IconComponent }: any, { context }: any) => {
    // Single value display in the control input
    if (context === "value") {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace)", fontSize: "14px" }}>
                {IconComponent ? <IconComponent size={14} color="var(--color-secondary)" /> : (
                    <div style={{ background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface))", padding: "4px", borderRadius: "6px", display: "flex" }}>
                        <Package size={14} color="var(--color-secondary)" />
                    </div>
                )}
                <span style={{ fontWeight: 600, color: "var(--color-text)" }}>{label}</span>
            </div>
        );
    }
    
    // Menu dropdown option list
    if (desc) { 
        return (
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                {IconComponent && (
                    <div style={{ background: "color-mix(in srgb, var(--color-accent) 10%, var(--color-surface))", padding: "8px", borderRadius: "8px", flexShrink: 0, marginTop: "2px" }}>
                        <IconComponent size={16} color="var(--color-secondary)" />
                    </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "14px", color: "var(--color-text)", fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: "12px", color: "var(--color-secondary)" }}>{desc}</span>
                </div>
            </div>
        );
    }

    // Default Tech Stack formatting
    return <span style={{ fontSize: "14px", color: "var(--color-text)", fontWeight: 500 }}>{label}</span>;
};

export function CategoryTechSelect({
    defaultCategory,
    defaultTechStack
}: {
    defaultCategory?: string | null;
    defaultTechStack?: string[] | null;
}) {
    const categoryId = useId();
    const techStackId = useId();

    const defaultCatOption = CATEGORY_OPTIONS.find(o => o.value === defaultCategory) || null;
    
    const defaultTechOptions = defaultTechStack 
        ? TECH_STACK_OPTIONS.filter(o => defaultTechStack.includes(o.value)) 
        : [];

    const [category, setCategory] = useState<any>(defaultCatOption);
    const [techStack, setTechStack] = useState<any[]>(defaultTechOptions);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Hidden inputs to pass data to the Next.js Server Action form */}
            <input type="hidden" name="category" value={category ? category.value : ""} />
            <input type="hidden" name="tech_stack" value={JSON.stringify(techStack ? techStack.map(t => t.value) : [])} />

            <div>
                <label className="field-label" style={{ marginBottom: "8px", display: "block" }}>Category</label>
                <Select
                    instanceId={categoryId}
                    options={CATEGORY_OPTIONS}
                    value={category}
                    onChange={setCategory}
                    styles={customStyles}
                    placeholder="Select category"
                    formatOptionLabel={formatOptionLabel}
                    isClearable
                />
            </div>

            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <label className="field-label" style={{ margin: 0 }}>Tech stack</label>
                    <span style={{ fontSize: "11px", color: "var(--color-secondary)", fontWeight: 700 }}>
                        {techStack ? techStack.length : 0} / 20
                    </span>
                </div>
                <Select
                    instanceId={techStackId}
                    isMulti
                    options={TECH_STACK_OPTIONS}
                    value={techStack}
                    onChange={(selected) => {
                        if (selected && selected.length > 20) return;
                        setTechStack(selected as any[]);
                    }}
                    styles={customStyles}
                    placeholder="Select technologies..."
                />
            </div>
        </div>
    );
}
