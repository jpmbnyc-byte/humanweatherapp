import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Human Weather — A guide to the wiring you already own" },
      {
        name: "description",
        content:
          "Three offices kept by the real sun. One Field Station always open. One Fascia quietly keeping the record.",
      },
      { property: "og:title", content: "Human Weather" },
      {
        property: "og:description",
        content:
          "A guide to the wiring you already own. Somatic field mapping, solar-timed offices, and offline voice.",
      },
    ],
  }),
  component: App,
});