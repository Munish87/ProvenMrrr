import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Plus, Building2, Save, Trash2, Globe, Sparkles } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { LogoUpload } from "@/components/startup/LogoUpload";
import { DashboardAddButton } from "@/components/startup/DashboardAddButton";
import { AnonymityToggle } from "@/components/startup/AnonymityToggle";

export const metadata = { title: "My Startups — Vetra Dashboard" };

export default async function DashboardStartupsPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { id: selectedId } = await searchParams;

    const { data: startups } = await supabase.from("startups").select("*").eq("owner_id", user.id).order("created_at", { ascending: false })
        .returns<{ id: string; name: string; description: string | null; website_url: string | null; category: string | null; country: string | null; is_listed_for_sale: boolean; is_anonymous: boolean; insights: any; tags: string[]; logo_url: string | null; asking_price: number | null; profit_margin_30d: number | null; contact_email: string | null; }[]>();
    const activeStartup = startups?.find((s) => s.id === selectedId) || startups?.[0];

    async function updateStartup(formData: FormData) {
        "use server";
        const supabaseServer = await createClient();
        const id = formData.get("id") as string;
        if (!id) return;

        const insights = {
            value_proposition: formData.get("value_proposition") as string,
            problem_solved: formData.get("problem_solved") as string,
            pricing: formData.get("pricing") as string,
            business_model: formData.get("business_model") as string,
        };
        const tagsRaw = formData.get("tags") as string;
        const tags = tagsRaw.split(",").map(t => t.trim()).filter(t => t.length > 0).slice(0, 3);

        const payload = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            website_url: formData.get("website_url") as string,
            category: formData.get("category") as string,
            country: formData.get("country") as string,
            asking_price: formData.get("asking_price") ? Number(formData.get("asking_price")) : null,
            profit_margin_30d: formData.get("profit_margin_30d") ? Number(formData.get("profit_margin_30d")) : null,
            contact_email: formData.get("contact_email") as string,
            is_anonymous: formData.get("is_anonymous") === "true",
            insights,
            tags
        };
        // @ts-ignore
        await supabaseServer.from("startups").update(payload).eq("id", id);
        revalidatePath("/dashboard/startups");
        revalidatePath(`/startup/${id}`);
    }

    async function toggleForSale(formData: FormData) {
        "use server";
        const supabaseServer = await createClient();
        const id = formData.get("id") as string;
        const currentStatus = formData.get("current_status") === "true";
        const payload = { is_listed_for_sale: !currentStatus };
        // @ts-ignore
        await supabaseServer.from("startups").update(payload).eq("id", id);
        revalidatePath("/dashboard/startups");
    }

    async function deleteStartup(formData: FormData) {
        "use server";
        const supabaseServer = await createClient();
        const id = formData.get("id") as string;
        await supabaseServer.from("startups").delete().eq("id", id);
        revalidatePath("/dashboard/startups");
        redirect("/dashboard/startups");
    }

    return (
        <div style={{ maxWidth: 1100, display: "flex", gap: 24, height: "calc(100vh - 96px)" }}>
            {/* Left — Startup List */}
            <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <h1 style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", letterSpacing: "-0.3px" }}>Startups</h1>
                    <DashboardAddButton />
                </div>

                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                    {!startups || startups.length === 0 ? (
                        <div className="card" style={{ textAlign: "center", padding: "40px 16px", border: "2px dashed var(--color-border)" }}>
                            <Building2 size={24} color="var(--color-border)" style={{ margin: "0 auto 8px" }} />
                            <p style={{ fontSize: 13, color: "var(--color-secondary)" }}>No startups yet.</p>
                        </div>
                    ) : (
                        startups.map((s) => {
                            const isActive = s.id === activeStartup?.id;
                            return (
                                <Link key={s.id} href={`/dashboard/startups?id=${s.id}`} style={{ textDecoration: "none", display: "block" }}>
                                    <div style={{
                                        padding: "12px 16px",
                                        borderRadius: 10,
                                        border: `1px solid ${isActive ? "var(--color-accent)" : "var(--color-border)"}`,
                                        background: isActive ? "#EEF2FF" : "white",
                                        cursor: "pointer",
                                        transition: "border-color 0.12s, background 0.12s",
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                                            <p style={{ fontSize: 14, fontWeight: 600, color: isActive ? "var(--color-accent)" : "var(--color-text)" }}>{s.name}</p>
                                            {s.is_listed_for_sale && <span className="tag-forsale" style={{ fontSize: 9 }}>For Sale</span>}
                                        </div>
                                        <p style={{ fontSize: 12, color: "var(--color-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                            {s.description || "No description"}
                                        </p>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Right — Edit Form */}
            {activeStartup ? (
                <div style={{ flex: 1, overflowY: "auto", paddingBottom: 32 }}>
                    {/* For Sale banner */}
                    <div style={{
                        marginBottom: 16,
                        padding: "14px 20px",
                        borderRadius: 10,
                        border: `1px solid ${activeStartup.is_listed_for_sale ? "#FDE047" : "var(--color-border)"}`,
                        background: activeStartup.is_listed_for_sale ? "#FEF9C3" : "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}>
                        <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: activeStartup.is_listed_for_sale ? "#A16207" : "var(--color-text)" }}>
                                {activeStartup.is_listed_for_sale ? "💰 Listed for sale" : "Sell your startup?"}
                            </p>
                            <p style={{ fontSize: 12, color: activeStartup.is_listed_for_sale ? "#A16207" : "var(--color-secondary)", marginTop: 2, opacity: 0.8 }}>
                                {activeStartup.is_listed_for_sale
                                    ? "Buyers can now see this listing."
                                    : "List securely through Vetra and reach thousands of verified buyers."}
                            </p>
                        </div>
                        <form action={toggleForSale}>
                            <input type="hidden" name="id" value={activeStartup.id} />
                            <input type="hidden" name="current_status" value={activeStartup.is_listed_for_sale.toString()} />
                            <button type="submit" className={activeStartup.is_listed_for_sale ? "btn btn-secondary btn-sm" : "btn btn-primary btn-sm"}>
                                {activeStartup.is_listed_for_sale ? "Delist" : "List for sale"}
                            </button>
                        </form>
                    </div>

                    <div className="card">
                        <form action={updateStartup}>
                            <input type="hidden" name="id" value={activeStartup.id} />

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--color-border)" }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)" }}>Edit &quot;{activeStartup.name}&quot;</h2>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <Link href={`/startup/${activeStartup.id}`} target="_blank" className="btn btn-secondary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                                        <Globe size={14} /> Public view
                                    </Link>
                                    <button type="submit" className="btn btn-primary btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                        <Save size={14} /> Save
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                {/* Logo + Name */}
                                <div style={{ display: "flex", gap: 20, alignItems: "flex-end" }}>
                                    <LogoUpload
                                        startupId={activeStartup.id}
                                        startupName={activeStartup.name}
                                        currentLogoUrl={activeStartup.logo_url}
                                        onUploadSuccess={async () => {
                                            "use server";
                                            revalidatePath("/dashboard/startups");
                                            revalidatePath(`/startup/${activeStartup.id}`);
                                        }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <label htmlFor="name" className="field-label">Company Name</label>
                                        <input id="name" name="name" defaultValue={activeStartup.name} className="field-input" required style={{ fontWeight: 600 }} />
                                    </div>
                                </div>

                                <AnonymityToggle initialValue={activeStartup.is_anonymous} />

                                {/* Description */}
                                <div>
                                    <label className="field-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        Description
                                        <span style={{ fontSize: 11, color: "var(--color-accent)", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                                            <Sparkles size={11} /> Auto-write
                                        </span>
                                    </label>
                                    <textarea id="description" name="description" rows={3} defaultValue={activeStartup.description || ""} className="field-input" placeholder="What does your startup do?" />
                                </div>

                                {/* URL + Category */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                    <div>
                                        <label htmlFor="website_url" className="field-label">Website URL</label>
                                        <input id="website_url" name="website_url" type="url" defaultValue={activeStartup.website_url || ""} className="field-input" placeholder="https://" />
                                    </div>
                                    <div>
                                        <label htmlFor="category" className="field-label">Category</label>
                                        <select id="category" name="category" defaultValue={activeStartup.category || ""} className="field-input" style={{ background: "white", cursor: "pointer" }}>
                                            <option value="">Select...</option>
                                            <option value="SaaS">SaaS</option>
                                            <option value="Developer Tools">Developer Tools</option>
                                            <option value="AI">AI</option>
                                            <option value="E-commerce">E-commerce</option>
                                            <option value="Fintech">Fintech</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Location */}
                                <div>
                                    <label htmlFor="country" className="field-label">Location</label>
                                    <input id="country" name="country" defaultValue={activeStartup.country || ""} className="field-input" placeholder="e.g. San Francisco, US" />
                                </div>

                                {/* Tags */}
                                <div>
                                    <label htmlFor="tags" className="field-label">Tags (Max 3, comma separated)</label>
                                    <input id="tags" name="tags" defaultValue={(activeStartup.tags || []).join(", ")} className="field-input" placeholder="AI, SaaS, Productivity" />
                                </div>

                                {/* Sale Details */}
                                {activeStartup.is_listed_for_sale && (
                                    <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 20 }}>
                                        <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 16 }}>Sale Details</h3>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                            <div>
                                                <label htmlFor="asking_price" className="field-label">Asking Price ($)</label>
                                                <input id="asking_price" name="asking_price" type="number" defaultValue={activeStartup.asking_price || ""} className="field-input" placeholder="e.g. 50000" />
                                            </div>
                                            <div>
                                                <label htmlFor="profit_margin_30d" className="field-label">Profit Margin (%)</label>
                                                <input id="profit_margin_30d" name="profit_margin_30d" type="number" step="0.1" defaultValue={activeStartup.profit_margin_30d || ""} className="field-input" placeholder="e.g. 85" />
                                            </div>
                                            <div style={{ gridColumn: "span 2" }}>
                                                <label htmlFor="contact_email" className="field-label">Contact Email (for buyers)</label>
                                                <input id="contact_email" name="contact_email" type="email" defaultValue={activeStartup.contact_email || ""} className="field-input" placeholder="hello@example.com" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Insights Grid */}
                                <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: 20, marginTop: 8 }}>
                                    <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text)", marginBottom: 16 }}>Startup Insights</h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                                        <div>
                                            <label htmlFor="value_proposition" className="field-label">Value Proposition</label>
                                            <textarea id="value_proposition" name="value_proposition" rows={2} defaultValue={activeStartup.insights?.value_proposition || ""} className="field-input" placeholder="e.g. The easiest way to X" />
                                        </div>
                                        <div>
                                            <label htmlFor="problem_solved" className="field-label">Problem Solved</label>
                                            <textarea id="problem_solved" name="problem_solved" rows={2} defaultValue={activeStartup.insights?.problem_solved || ""} className="field-input" placeholder="e.g. Helping users with Y" />
                                        </div>
                                        <div>
                                            <label htmlFor="pricing" className="field-label">Pricing Model</label>
                                            <input id="pricing" name="pricing" defaultValue={activeStartup.insights?.pricing || ""} className="field-input" placeholder="e.g. Subscription, $29/mo" />
                                        </div>
                                        <div>
                                            <label htmlFor="business_model" className="field-label">Business Model</label>
                                            <input id="business_model" name="business_model" defaultValue={activeStartup.insights?.business_model || ""} className="field-input" placeholder="e.g. B2B, Marketplace" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Delete */}
                        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end" }}>
                            <form action={deleteStartup}>
                                <input type="hidden" name="id" value={activeStartup.id} />
                                <button type="submit" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#EF4444", background: "none", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: 6 }}>
                                    <Trash2 size={14} /> Delete startup
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ textAlign: "center" }}>
                        <Building2 size={40} color="var(--color-border)" style={{ margin: "0 auto 12px" }} />
                        <p style={{ color: "var(--color-secondary)", marginBottom: 16 }}>Select a startup to edit.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
