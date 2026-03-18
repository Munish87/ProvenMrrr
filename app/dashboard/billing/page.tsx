import { CreditCard, Info } from "lucide-react";

export const metadata = { title: "Billing — ProvenMRR Dashboard" };

export default function BillingPage() {
    return (
        <div style={{ maxWidth: 800 }}>
            <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.3px", marginBottom: 4 }}>
                    Billing
                </h1>
                <p style={{ fontSize: 14, color: "var(--color-secondary)", fontWeight: 500 }}>Manage your invoices and payment methods.</p>
            </div>

            <div className="card" style={{ padding: "32px 40px" }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-text)", marginBottom: 20 }}>Invoices & payments</h2>
                
                <div style={{ 
                    display: "flex", 
                    alignItems: "flex-start", 
                    gap: 12, 
                    padding: "16px 20px", 
                    background: "rgba(0,0,0,0.02)", 
                    borderRadius: 12, 
                    border: "1px solid rgba(0,0,0,0.05)" 
                }}>
                    <div style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 6, 
                        background: "rgba(0,0,0,0.03)",
                        border: "1px solid rgba(0,0,0,0.05)",
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
