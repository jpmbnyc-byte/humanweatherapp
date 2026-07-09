import { createFileRoute } from '@tanstack/react-router'
import { lazy, Suspense } from "react";
import BootSplashFallback from "@/components/BootSplashFallback";

const App = lazy(() => import("@/App"));

function IndexPage() {
  return (
    <Suspense fallback={<BootSplashFallback />}>
      <App />
    </Suspense>
  );
}

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Human Weather — Somatic Climate & Circadian Alignment" },
      {
        name: "description",
        content:
          "A luxury-minimal somatic weather app mapping the climate inside your body — breathwork, frequency therapy, light, and solar-aware circadian protocols.",
      },
      { property: "og:title", content: "Human Weather" },
      {
        property: "og:description",
        content:
          "Map your inner climate. Breathwork, frequencies, light therapy, and solar-aware circadian rhythms.",
      },
    ],
  }),
  component: IndexPage,
});
