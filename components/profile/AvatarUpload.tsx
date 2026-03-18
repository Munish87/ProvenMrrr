"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Upload, X, Loader2, User } from "lucide-react";
import Image from "next/image";

interface AvatarUploadProps {
    userId: string;
    userName: string;
    currentAvatarUrl: string | null;
    onUploadSuccess: (newUrl: string) => void;
}

export function AvatarUpload({ userId, userName, currentAvatarUrl, onUploadSuccess }: AvatarUploadProps) {
    const supabase = createClient();
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync local preview with prop updates (e.g. after page refresh or navigation)
    useEffect(() => {
        setPreviewUrl(currentAvatarUrl);
    }, [currentAvatarUrl]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
            const fileName = `${userId}-${Date.now()}.${fileExt}`;

            // Upload to Supabase 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from("avatars")
                .upload(fileName, file, { cacheControl: "3600", upsert: true });

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(fileName);

            // Save back to Users record
            const { error: updateError } = await (supabase as any)
                .from("users")
                .update({ avatar_url: publicUrl })
                .eq("id", userId);

            if (updateError) throw updateError;

            // Success callback to parent (revalidate)
            onUploadSuccess(publicUrl);

        } catch (err: any) {
            console.error("Avatar upload failed:", err);
            setErrorMsg(err.message || "Failed to upload profile picture.");
            setPreviewUrl(currentAvatarUrl); // Revert preview
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="group relative overflow-hidden cursor-pointer"
                style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: previewUrl ? "transparent" : "var(--color-accent)",
                    border: previewUrl ? "none" : "2px dashed var(--color-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                }}
            >
                {/* Image View */}
                {previewUrl ? (
                    <Image
                        src={previewUrl || ""}
                        alt={`${userName} avatar`}
                        fill
                        className="object-cover"
                        unoptimized
                    />
                ) : (
                    <span style={{ fontSize: 24, fontWeight: 700, color: "white" }}>
                        {userName ? userName.charAt(0).toUpperCase() : <User size={30} />}
                    </span>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    {uploading ? (
                        <Loader2 className="animate-spin text-white w-6 h-6" />
                    ) : (
                        <Upload className="text-white w-6 h-6" />
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
    );
}
