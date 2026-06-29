import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";

export const Route = createFileRoute("/")({
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
  component: App,
});