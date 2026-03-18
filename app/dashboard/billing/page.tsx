import { CreditCard, Info } from "lucide-react";

export const metadata = { title: "Billing — Vetra Dashboard" };

export default function BillingPage() {
    return (
        <div style={{ maxWidth: 800 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.3px", marginBottom: 4 }}>
                    Billing
                </h1>
                <p style={{ fontSize: 14, color: "var(--color-secondary)" }}>Manage your invoices and payment methods.</p>
            </div>

            <div className="card" style={{ padding: "24px 32px" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 20 }}>Invoices & payments</h2>
                
                <div style={{ 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: 12, 
                    padding: "16px 20px", 
                    background: "#F9FAFB", 
                    borderRadius: 10, 
                    border: "1px solid var(--color-border)" 
                }}>
                    <div style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 6, 
                        background: "white", 
                        border: "1px solid var(--color-border)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        flexShrink: 0
                    }}>
                        <CreditCard size={16} color="var(--color-secondary)" />
                    </div>
                    <div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--color-secondary)", lineHeight: 1.5 }}>
                            No billing history yet. When you purchase a listing boost, your invoices will appear here.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
