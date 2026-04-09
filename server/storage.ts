/**
 * S3 Storage Helpers (Stub)
 * 
 * This module is a placeholder. The application does not currently use S3 storage.
 * If you need file storage in the future, implement using AWS S3 SDK or similar.
 */

export async function storagePut(
  _key: string,
  _data: Buffer | Uint8Array | string,
  _contentType?: string
): Promise<{ key: string; url: string }> {
  throw new Error("Storage is not configured. Implement S3 or local file storage if needed.");
}

export async function storageGet(
  _key: string,
  _expiresIn?: number
): Promise<{ key: string; url: string }> {
  throw new Error("Storage is not configured. Implement S3 or local file storage if needed.");
}
