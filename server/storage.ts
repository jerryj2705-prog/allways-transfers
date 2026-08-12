/**
 * File Storage Helpers
 * 
 * Uses the Forge API for file storage with CDN delivery.
 * Files are uploaded via multipart form-data and served from CDN.
 */

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL ?? "";
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY ?? "";

/**
 * Upload a file to storage and get a public CDN URL.
 * 
 * @param key - The storage path/key for the file (e.g., "payment-proofs/booking-123.png")
 * @param data - File content as Buffer, Uint8Array, or string
 * @param contentType - MIME type of the file (e.g., "image/png")
 * @returns Object with key and public URL
 */
export async function storagePut(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType?: string
): Promise<{ key: string; url: string }> {
  if (!FORGE_API_URL || !FORGE_API_KEY) {
    throw new Error("Storage is not configured. BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY are required.");
  }

  // Convert data to a Blob for FormData
  const blob = new Blob(
    [data instanceof Buffer ? new Uint8Array(data) : data],
    { type: contentType || "application/octet-stream" }
  );

  // Extract filename from key
  const filename = key.split("/").pop() || "file";

  const formData = new FormData();
  formData.append("file", blob, filename);
  formData.append("path", key);

  const response = await fetch(`${FORGE_API_URL}/v1/storage/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Storage upload failed (${response.status}): ${errorText}`);
  }

  const result = await response.json() as { url: string };

  return {
    key,
    url: result.url,
  };
}

/**
 * Get a public URL for a stored file.
 * Since files are served from CDN, this just constructs the URL.
 * 
 * @param key - The storage path/key for the file
 * @param _expiresIn - Not used (CDN URLs are public)
 * @returns Object with key and public URL
 */
export async function storageGet(
  key: string,
  _expiresIn?: number
): Promise<{ key: string; url: string }> {
  // The URL pattern from the Forge API CDN
  // Since we already store the full URL in the database, this is mainly for compatibility
  return {
    key,
    url: key, // When we store the full URL, just return it
  };
}
