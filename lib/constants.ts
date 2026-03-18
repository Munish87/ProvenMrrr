import {
    Codepen, LayoutTemplate, Server, Cpu, Database, CloudRain, Briefcase, Frame,
    TerminalSquare, LayoutPanelLeft, Code2, Play, Activity, Hexagon, Cloud, ShieldCheck,
    Box, Boxes, ServerCog, Combine
} from "lucide-react";

export const TECH_STACK_OPTIONS = [
    { value: "React", label: "React", icon: Codepen, category: "frontend" },
    { value: "Next.js", label: "Next.js", icon: LayoutTemplate, category: "frontend" },
    { value: "Node.js", label: "Node.js", icon: Server, category: "backend" },
    { value: "Python", label: "Python", icon: Hexagon, category: "backend" },
    { value: "Django", label: "Django", icon: Combine, category: "backend" },
    { value: "Ruby on Rails", label: "Ruby on Rails", icon: Frame, category: "backend" },
    { value: "Vue.js", label: "Vue.js", icon: LayoutPanelLeft, category: "frontend" },
    { value: "Svelte", label: "Svelte", icon: Code2, category: "frontend" },
    { value: "Tailwind CSS", label: "Tailwind CSS", icon: Briefcase, category: "frontend" },
    { value: "PostgreSQL", label: "PostgreSQL", icon: Database, category: "backend" },
    { value: "MySQL", label: "MySQL", icon: Database, category: "backend" },
    { value: "MongoDB", label: "MongoDB", icon: Database, category: "backend" },
    { value: "Supabase", label: "Supabase", icon: CloudRain, category: "backend" },
    { value: "Firebase", label: "Firebase", icon: Cloud, category: "backend" },
    { value: "AWS", label: "AWS", icon: ServerCog, category: "backend" },
    { value: "Vercel", label: "Vercel", icon: Play, category: "backend" },
    { value: "Stripe", label: "Stripe", icon: Activity, category: "backend" },
    { value: "Docker", label: "Docker", icon: Box, category: "backend" },
    { value: "Kubernetes", label: "Kubernetes", icon: Boxes, category: "backend" },
    { value: "GraphQL", label: "GraphQL", icon: TerminalSquare, category: "backend" }
];
