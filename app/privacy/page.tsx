import React from "react";
import Link from "next/link";
import { X } from "lucide-react";

export default function PrivacyPolicy() {
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
          Privacy Policy
        </h1>
        <p style={{ color: "var(--color-muted)", marginBottom: "32px" }}>
          Last updated: March 19, 2026
        </p>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>1. Introduction</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            Welcome to ProvenMRR. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>2. Information We Collect</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            We collect personal information that you voluntarily provide to us when you register on the Website, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Website or otherwise when you contact us.
          </p>
          <ul style={{ color: "var(--color-secondary)", marginLeft: "24px", listStyleType: "disc" }}>
            <li style={{ marginBottom: "8px" }}>Personal information provided by you (Name, Email, etc.)</li>
            <li style={{ marginBottom: "8px" }}>Stripe data (when connected for revenue verification)</li>
            <li style={{ marginBottom: "8px" }}>Usage data and Analytics</li>
          </ul>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>3. How We Use Your Information</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            We use personal information collected via our Website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>4. Data Security</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>5. Contact Us</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            If you have questions or comments about this policy, you may reach out to us via our <Link href="/contact" style={{ color: "var(--color-accent)", fontWeight: 600 }}>Contact Page</Link>.
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
