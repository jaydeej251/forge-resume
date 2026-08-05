"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: Record<string, unknown>,
          ) => void;
        };
      };
    };
  }
}

type GoogleSignInButtonProps = {
  onCredential: (idToken: string) => void | Promise<void>;
  disabled?: boolean;
};

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function GoogleSignInButton({
  onCredential,
  disabled,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!CLIENT_ID) {
      setReady(false);
      return;
    }

    let cancelled = false;

    const init = () => {
      if (cancelled || !containerRef.current || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (response) => {
          void onCredentialRef.current(response.credential);
        },
      });
      containerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "rectangular",
      });
      setReady(true);
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-google-gis="true"]',
    );
    if (existing) {
      if (window.google) init();
      else existing.addEventListener("load", init);
      return () => {
        cancelled = true;
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleGis = "true";
    script.onload = init;
    script.onerror = () => setError("Could not load Google Sign-In");
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, []);

  if (!CLIENT_ID) {
    return (
      <p className="text-center text-xs text-[var(--muted)]">
        Google Sign-In is not configured for this environment.
      </p>
    );
  }

  return (
    <div className={disabled ? "pointer-events-none opacity-60" : ""}>
      <div ref={containerRef} className="flex justify-center" />
      {!ready && !error && (
        <p className="mt-2 text-center text-xs text-[var(--muted)]">
          Loading Google…
        </p>
      )}
      {error && (
        <p className="mt-2 text-center text-xs text-[var(--danger)]">{error}</p>
      )}
    </div>
  );
}
