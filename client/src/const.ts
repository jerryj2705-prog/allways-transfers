export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL - now points to local /login page
export const getLoginUrl = (returnTo?: string) => {
  const params = new URLSearchParams();
  if (returnTo) {
    params.set("returnTo", returnTo);
  }
  const query = params.toString();
  return `/login${query ? `?${query}` : ""}`;
};
