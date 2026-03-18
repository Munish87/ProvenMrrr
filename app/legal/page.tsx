import React from "react";
import Link from "next/link";
import { X } from "lucide-react";

export default function Legal() {
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
          Legal Notice
        </h1>
        <p style={{ color: "var(--color-muted)", marginBottom: "32px" }}>
          Last updated: March 19, 2026
        </p>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>1. Company Information</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "8px" }}>
            <strong>Company Name:</strong> ProvenMRR
          </p>
          <p style={{ color: "var(--color-secondary)", marginBottom: "8px" }}>
            <strong>Email:</strong> legal@provenmrr.com
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>2. Representative</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            The representative of ProvenMRR is the designated project lead. For any legal inquiries, please use the contact information provided above.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>3. Intellectual Property</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            All content on this website, including text, graphics, logos, images, and software, is the property of ProvenMRR and is protected by international copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>4. Governing Law</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            These legal notices and the use of the website are governed by the laws of the jurisdiction in which the company operates, without regard to its conflict of law principles.
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
