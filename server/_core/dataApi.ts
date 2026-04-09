/**
 * Data API Helper (Stub)
 * 
 * This module is a placeholder. The application does not currently use external data APIs.
 * If you need external data integrations, implement them directly using fetch or axios.
 */

export type DataApiCallOptions = {
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
  pathParams?: Record<string, unknown>;
  formData?: Record<string, unknown>;
};

export async function callDataApi(
  _apiId: string,
  _options: DataApiCallOptions = {}
): Promise<unknown> {
  throw new Error("Data API is not configured.");
}
