import {
  Outlet,
  Link,
  createRootRoute,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { scheduleDeferredFonts } from "../lib/deferredFonts";

const BOOT_SPLASH_CSS = `
#hw-boot{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:#faf8f5;color:#2c2824;font-family:Georgia,"Times New Roman",serif}
#hw-boot-inner{text-align:center;padding:1.5rem}
#hw-boot-eyebrow{font-size:11px;letter-spacing:0.25em;text-transform:uppercase;opacity:0.4;margin:0 0 1rem}
#hw-boot-title{font-size:clamp(1.75rem,6vw,2.5rem);font-weight:500;margin:0;line-height:1.15}
#hw-boot-title em{font-style:italic;color:#8a6f2e}
#hw-boot-sub{font-size:1rem;font-style:italic;opacity:0.65;margin:1rem 0 0}
@media (prefers-color-scheme:dark){#hw-boot{background:#141210;color:#f5f0e8}#hw-boot-title em{color:#d4b85a}}
`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
    document.getElementById("hw-boot")?.remove();
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Human Weather App" },
      { name: "description", content: "Tracking the emotional climate." },
      { name: "author", content: "Lovable" },
      { property: "og:title", content: "Human Weather App" },
      { property: "og:description", content: "Tracking the emotional climate." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "Human Weather App" },
      { name: "twitter:description", content: "Tracking the emotional climate." },
      {
        property: "og:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/Pp3cGsUtaJRNfvToOZt1zOOuAmk2/social-images/social-1782761956593-IMG_4540.webp",
      },
      {
        name: "twitter:image",
        content:
          "https://storage.googleapis.com/gpt-engineer-file-uploads/Pp3cGsUtaJRNfvToOZt1zOOuAmk2/social-images/social-1782761956593-IMG_4540.webp",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <style dangerouslySetInnerHTML={{ __html: BOOT_SPLASH_CSS }} />
      </head>
      <body>
        <div id="hw-boot" aria-live="polite" aria-busy="true">
          <div id="hw-boot-inner">
            <p id="hw-boot-eyebrow">human weather</p>
            <h1 id="hw-boot-title">
              Human <em>Weather</em>
            </h1>
            <p id="hw-boot-sub">Opening your field station…</p>
          </div>
        </div>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    scheduleDeferredFonts();
  }, []);

  return <Outlet />;
}
