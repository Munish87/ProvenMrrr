export function slugify(text: string) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w-]+/g, '')     // Remove all non-word chars
        .replace(/--+/g, '-');      // Replace multiple - with single -
}

export const CATEGORY_MAP: Record<string, string> = {
    "analytics": "Analytics",
    "artificial-intelligence": "Artificial Intelligence",
    "community": "Community",
    "content-creation": "Content Creation",
    "crypto-web3": "Crypto & Web3",
    "customer-support": "Customer Support",
    "design": "Design Tools",
    "developer-tools": "Developer Tools",
    "e-commerce": "E-commerce",
    "education": "Education",
    "entertainment": "Entertainment",
    "fintech": "Fintech",
    "games": "Games",
    "green-tech": "Green Tech",
    "health-fitness": "Health & Fitness",
    "iot-hardware": "IoT & Hardware",
    "legal": "Legal",
    "marketing": "Marketing",
    "marketplace": "Marketplace",
    "mobile-apps": "Mobile Apps",
    "news-magazines": "News & Magazines",
    "no-code": "No-Code",
    "productivity": "Productivity",
    "real-estate": "Real Estate",
    "recruiting-hr": "Recruiting & HR",
    "saas": "SaaS",
    "software": "Software",
    "sales": "Sales",
    "security": "Security",
    "social-media": "Social Media",
    "travel": "Travel",
    "utilities": "Utilities",
};
