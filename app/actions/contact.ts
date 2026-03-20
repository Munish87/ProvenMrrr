"use server";

import { createClient } from "@/lib/supabase/server";
import resend from "@/lib/resend";
import { z } from "zod";

const ContactSchema = z.object({
    email: z.string().email(),
    problem: z.string().min(5),
});

export async function submitContactInquiry(formData: FormData) {
    const rawEmail = formData.get("email");
    const rawProblem = formData.get("problem");

    console.log("Submit contact inquiry:", { rawEmail, rawProblem });

    const result = ContactSchema.safeParse({
        email: rawEmail,
        problem: rawProblem,
    });

    if (!result.success) {
        return { success: false, error: "Invalid form data. Description must be at least 5 characters." };
    }

    const { email, problem } = result.data;
    const supabase = await createClient();

    try {
        // 1. Log to database first (for history)
        const { error: dbError } = await supabase.from("contact_inquiries").insert([{ email, message: problem }]);
        if (dbError) throw dbError;

        // 2. Send email via Resend
        // If they have no API key, this will fail gracefully but return error msg.
        if (process.env.RESEND_API_KEY) {
            try {
                const { data, error: mailError } = await resend.emails.send({
                    from: "ProvenMRR <onboarding@resend.dev>", // This needs to be changed once domain is verified
                    to: ["mennyparmar@gmail.com"],
                    subject: `New Contact Inquiry from ${email}`,
                    text: `From: ${email}\n\nMessage:\n${problem}`,
                    replyTo: email,
                });

                if (mailError) {
                    console.error("Resend Mail Error:", mailError);
                    // Don't fail the whole request if DB insert succeeded; just log it.
                    // But maybe return success: true even if mail fail?
                }
            } catch (err) {
                console.error("Resend delivery failed:", err);
            }
        } else {
            console.warn("RESEND_API_KEY is missing. Email not sent, message saved in DB only.");
        }

        return { success: true };

    } catch (error) {
        console.error("Contact form error:", error);
        return { success: false, error: "Database error. Please try again later." };
    }
}
