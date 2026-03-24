import React from "react";
import Link from "next/link";
import { X } from "lucide-react";

export default function Refunds() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="main-col">
      <div className="card" style={{ padding: "48px", position: "relative" }}>
        <Link 
          href="/" 
          className="btn btn-secondary" 
          style={{ position: "absolute", top: "24px", right: "24px", width: "40px", height: "40px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%" }}
        >
          <X size={20} />
        </Link>
        <h1 style={{ fontSize: "32px", fontWeight: "800", marginBottom: "24px", letterSpacing: "-0.04em" }}>
          Sales and Refund Policy
        </h1>
        <p style={{ color: "var(--color-muted)", marginBottom: "32px" }}>
          Last updated: March 19, 2026
        </p>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>1. Sales</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            All sales of digital products and services, including startup listings and subscription services, are final at the time of purchase. By completing a purchase, you agree to the terms and conditions set forth in this policy.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>2. Refund Eligibility</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            Refunds are generally not provided for digital services once they have been rendered or accessed. However, we may consider refund requests on a case-by-case basis under the following circumstances:
          </p>
          <ul style={{ color: "var(--color-secondary)", marginLeft: "24px", listStyleType: "disc" }}>
            <li style={{ marginBottom: "8px" }}>Duplicate billing errors.</li>
            <li style={{ marginBottom: "8px" }}>Technical issues that prevent access to the service (verified by our team).</li>
            <li style={{ marginBottom: "8px" }}>Unauthorized transactions.</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>3. Refund Process</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            To request a refund, please use our <Link href="/contact" style={{ color: "var(--color-accent)", fontWeight: 600 }}>Contact Page</Link> within 7 days of the transaction. Your request must include the transaction ID and a detailed explanation for the refund. Our team will review your request and respond within 3-5 business days.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>4. Chargebacks</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            We reserve the right to suspend or terminate any account associated with a chargeback or dispute. We encourage you to contact us directly to resolve any billing issues before initiating a chargeback with your financial institution.
          </p>
        </section>

        <div style={{ marginTop: "48px", borderTop: "1px solid var(--color-border)", paddingTop: "24px", textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: "var(--color-muted)" }}>
            &copy; {currentYear} ProvenMRR. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
