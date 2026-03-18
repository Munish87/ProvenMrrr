import React from "react";
import Link from "next/link";
import { X } from "lucide-react";

export default function TermsOfUse() {
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
          Terms of Use
        </h1>
        <p style={{ color: "var(--color-muted)", marginBottom: "32px" }}>
          Last updated: March 19, 2026
        </p>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>1. Terms</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            By accessing the website at provenmrr.com, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>2. Use License</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            Permission is granted to temporarily download one copy of the materials (information or software) on ProvenMRR's website for personal, non-commercial transitory viewing only.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>3. Disclaimer</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            The materials on ProvenMRR's website are provided on an 'as is' basis. ProvenMRR makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>4. Limitations</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            In no event shall ProvenMRR or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on ProvenMRR's website, even if ProvenMRR or a ProvenMRR authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>
        </section>

        <section style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "16px" }}>5. Accuracy of Materials</h2>
          <p style={{ color: "var(--color-secondary)", marginBottom: "16px" }}>
            The materials appearing on ProvenMRR's website could include technical, typographical, or photographic errors. ProvenMRR does not warrant that any of the materials on its website are accurate, complete or current.
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
