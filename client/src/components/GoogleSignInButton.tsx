import { useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// Google GSI types (using inline typing to avoid conflict with google.maps global)
interface GoogleGSI {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: { credential: string }) => void;
        auto_select?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      renderButton: (
        element: HTMLElement,
        config: {
          theme?: "outline" | "filled_blue" | "filled_black";
          size?: "large" | "medium" | "small";
          text?: "signin_with" | "signup_with" | "continue_with" | "signin";
          shape?: "rectangular" | "pill" | "circle" | "square";
          width?: number;
          logo_alignment?: "left" | "center";
          type?: "standard" | "icon";
        }
      ) => void;
      prompt: () => void;
    };
  };
}

function getGoogleGSI(): GoogleGSI | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).google as GoogleGSI | undefined;
}

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  rememberMe?: boolean;
}

// The Google Client ID is injected via Vite env
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function GoogleSignInButton({
  onSuccess,
  text = "signin_with",
  rememberMe = true,
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const googleLoginMutation = trpc.auth.googleLogin.useMutation({
    onSuccess: () => {
      toast.success("Signed in with Google successfully");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Google sign-in failed");
    },
  });

  const handleCredentialResponse = useCallback(
    (response: { credential: string }) => {
      googleLoginMutation.mutate({
        credential: response.credential,
        rememberMe,
      });
    },
    [rememberMe]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.warn("[GoogleSignIn] VITE_GOOGLE_CLIENT_ID is not configured");
      return;
    }

    const initGoogle = () => {
      const gsi = getGoogleGSI();
      if (!gsi || !buttonRef.current || initializedRef.current) return;

      try {
        gsi.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        gsi.accounts.id.renderButton(buttonRef.current, {
          theme: "filled_black",
          size: "large",
          text,
          shape: "rectangular",
          width: buttonRef.current.offsetWidth || 360,
          logo_alignment: "left",
        });

        initializedRef.current = true;
      } catch (err) {
        console.error("[GoogleSignIn] Failed to initialize:", err);
      }
    };

    // Google GSI script may load asynchronously
    if (getGoogleGSI()) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (getGoogleGSI()) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);

      // Stop checking after 10 seconds
      const timeout = setTimeout(() => clearInterval(interval), 10000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [handleCredentialResponse, text]);

  if (!GOOGLE_CLIENT_ID) {
    return null; // Don't render anything if Google Sign-In is not configured
  }

  return (
    <div className="w-full">
      <div
        ref={buttonRef}
        className="w-full flex items-center justify-center"
        style={{ minHeight: 44 }}
      />
      {googleLoginMutation.isPending && (
        <div className="mt-2 text-center text-sm text-zinc-400">
          <span className="inline-flex items-center gap-2">
            <span className="animate-spin h-3 w-3 border-2 border-zinc-400 border-t-transparent rounded-full" />
            Signing in...
          </span>
        </div>
      )}
    </div>
  );
}
