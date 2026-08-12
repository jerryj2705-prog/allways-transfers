import type { CookieOptions, Request } from "express";

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);

  return {
    httpOnly: true,
    path: "/",
    // `lax` keeps the session cookie on same-site (first-party) navigation
    // and top-level requests while blocking it on cross-site subrequests,
    // which provides built-in CSRF protection. The app does not perform
    // cross-site authenticated requests, so `lax` is the correct choice.
    sameSite: "lax",
    // Mark the cookie Secure whenever the request is served over HTTPS.
    secure,
  };
}
