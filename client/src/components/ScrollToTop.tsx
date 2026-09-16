import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Scrolls the window to the top on every route (pathname) change.
 *
 * Rendered once inside the app tree so it fires on all navigations. Without
 * this, wouter (like most SPA routers) keeps the previous scroll position when
 * you navigate, which made pages open mid-scroll.
 *
 * Hash links (e.g. /contact#faq, #services) are respected: when the URL has a
 * hash we scroll to the matching element instead of jumping to the top, so the
 * in-page anchor navigation still works.
 */
export default function ScrollToTop() {
  const [pathname] = useLocation();

  useEffect(() => {
    const hash = window.location.hash;

    if (hash) {
      // Let the target element render, then scroll to it.
      const id = hash.slice(1);
      // Defer to the next frame so lazy-loaded pages have mounted.
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "auto", block: "start" });
        } else {
          window.scrollTo(0, 0);
        }
      });
      return;
    }

    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
