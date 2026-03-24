"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Loader2 } from "lucide-react";
import Image from "next/image";

interface LogoUploadProps {
    startupId: string;
    startupName: string;
    currentLogoUrl: string | null;
    onUploadSuccess: () => void;
}

export function LogoUpload({ startupId, startupName, currentLogoUrl, onUploadSuccess }: LogoUploadProps) {
    const supabase = createClient();
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith("image/")) {
            setErrorMsg("Please select an image file.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) { // 2MB
            setErrorMsg("Image size must be less than 2MB.");
            return;
        }

        setErrorMsg(null);
        setUploading(true);

        try {
            // Local preview
            const objectUrl = URL.createObjectURL(file);
            setPreviewUrl(objectUrl);

            // Construct unique filepath
            const fileExt = file.name.split('.').pop();
            const fileName = `${startupId}-${Date.now()}.${fileExt}`;

            // Upload to Supabase 'logos' bucket
            const { error: uploadError } = await supabase.storage
                .from("logos")
                .upload(fileName, file, { cacheControl: "3600", upsert: true });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from("logos")
                .getPublicUrl(fileName);

            // Save back to Startup record
            const { error: updateError } = await supabase
                .from("startups")
                // @ts-ignore
                .update({ logo_url: publicUrl })
                .eq("id", startupId);

            if (updateError) throw updateError;

            // Success callback to parent (revalidate)
            onUploadSuccess();

        } catch (err: any) {
            console.error("Logo upload failed:", err);
            setErrorMsg(err.message || "Failed to upload logo.");
            setPreviewUrl(currentLogoUrl); // Revert preview
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div>
            <label className="field-label">Logo</label>
            <div className="flex flex-col gap-2">
                <div
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className="group relative overflow-hidden cursor-pointer"
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: previewUrl
                            ? "linear-gradient(180deg, rgba(214, 223, 230, 0.12), rgba(96, 103, 109, 0.08) 20%, rgba(26, 28, 28, 0.66) 62%, rgba(18, 19, 18, 0.88))"
                            : "linear-gradient(180deg, rgba(214, 223, 230, 0.14), rgba(102, 108, 114, 0.08) 20%, rgba(26, 27, 27, 0.68) 62%, rgba(17, 18, 17, 0.9))",
                        border: previewUrl ? "1px solid rgba(224, 232, 239, 0.18)" : "1px dashed rgba(224, 232, 239, 0.24)",
                        boxShadow: "0 14px 26px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.16)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {/* Image View */}
                    {previewUrl ? (
                        <div style={{ position: "absolute", inset: 4, borderRadius: "50%", overflow: "hidden" }}>
                                <Image
                                    src={previewUrl || ""}
                                    alt={`${startupName} logo`}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                    sizes="64px"
                                />
                        </div>
                    ) : (
                        <span style={{ fontSize: 22, fontWeight: 800, color: "var(--color-text)" }}>
                            {startupName.charAt(0).toUpperCase()}
                        </span>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {uploading ? (
                            <Loader2 className="animate-spin text-white w-5 h-5" />
                        ) : (
                            <Upload className="text-white w-5 h-5" />
                        )}
                    </div>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                />

                {errorMsg && (
                    <p className="text-xs text-rose-500 flex items-center gap-1">
                        <X size={12} /> {errorMsg}
                    </p>
                )}
            </div>
        </div>
    );
}
