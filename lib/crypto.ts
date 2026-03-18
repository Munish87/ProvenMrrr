/**
 * AES-256-GCM encryption for Stripe API keys.
 * Server-only — never import this in client components.
 */

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_HEX = process.env.ENCRYPTION_KEY;

function getKey(): Buffer {
    if (!KEY_HEX || KEY_HEX.length !== 64) {
        throw new Error(
            "ENCRYPTION_KEY must be set as a 64-char hex string (32 bytes). Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
        );
    }
    return Buffer.from(KEY_HEX, "hex");
}

/**
 * Encrypts a Stripe API key.
 * Returns a colon-separated string: `iv:authTag:ciphertext` (all base64).
 */
export function encryptApiKey(plaintext: string): string {
    const key = getKey();
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return [
        iv.toString("base64"),
        authTag.toString("base64"),
        encrypted.toString("base64"),
    ].join(":");
}

/**
 * Decrypts a Stripe API key previously encrypted with `encryptApiKey`.
 */
export function decryptApiKey(encrypted: string): string {
    const key = getKey();
    const parts = encrypted.split(":");

    if (parts.length !== 3) {
        throw new Error("Invalid encrypted key format");
    }

    const [ivB64, authTagB64, ciphertextB64] = parts;
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(authTagB64, "base64");
    const ciphertext = Buffer.from(ciphertextB64, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
        "utf8"
    );
}
