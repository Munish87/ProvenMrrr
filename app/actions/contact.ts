"use server";

import { createClient } from "@/lib/supabase/server";
import resend from "@/lib/resend";
import { z } from "zod";

const ContactSchema = z.object({
    email: z.string().email(),
    problem: z.string().min(5),
});

export async function submitContactInquiry(formData: FormData) {
    try {
        const rawEmail = formData.get("email");
        const rawProblem = formData.get("problem");

        console.log("Submit contact inquiry:", { rawEmail, rawProblem });

        // 1. Validate
        const result = ContactSchema.safeParse({
            email: rawEmail,
            problem: rawProblem,
        });

        if (!result.success) {
            return { success: false, error: "Invalid form data. Description must be at least 5 characters." };
        }

        const { email, problem } = result.data;

        // 2. Initialize Supabase
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            console.error("Supabase environment variables are missing!");
            return { success: false, error: "System configuration error. Please contact support." };
        }

        const supabase = await createClient();

        // 3. Log to database first (for history)
        const { error: dbError } = await supabase.from("contact_inquiries").insert([{ email, message: problem }]);
        if (dbError) {
            console.error("Database insert failed:", dbError);
            throw dbError;
        }

        // 4. Send email via Resend
        if (process.env.RESEND_API_KEY) {
            try {
                // Import resend dynamically or ensure it doesn't throw on init
                const { error: mailError } = await resend.emails.send({
                    from: "ProvenMRR <onboarding@resend.dev>",
                    to: ["mennyparmar@gmail.com"],
                    subject: `New Contact Inquiry from ${email}`,
                    text: `From: ${email}\n\nMessage:\n${problem}`,
                    replyTo: email,
                });

                if (mailError) {
                    console.error("Resend Mail Error:", mailError);
                }
            } catch (err) {
                console.error("Resend delivery failed:", err);
            }
        }

        return { success: true };

    } catch (error) {
        console.error("Contact form error:", error);
        return { success: false, error: "Failed to submit. Please check your connection and try again." };
    }
}
