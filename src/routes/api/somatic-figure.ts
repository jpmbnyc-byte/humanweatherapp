import { createFileRoute } from "@tanstack/react-router";

const MODEL = "google/gemini-3.1-flash-image-preview";
const MAX_SELFIE_LENGTH = 2_500_000;

const FIGURE_PROMPT = `Using the attached selfie only as the likeness reference, create one complete
portrait-oriented full-body anatomical manuscript illustration for a quiet somatic-awareness
interface. Preserve the person's recognizable face, skin tone, hair, facial hair, and visible
character without caricature. Show the person standing front-facing, head gently lowered, arms
relaxed beside the body, hands visible, bare feet together, and the entire body in frame. Dress
them in a simple close-fitting, long-sleeved neutral garment.

Visual language: an exquisitely restrained late-Renaissance anatomical study on warm ivory
parchment; very fine graphite, silverpoint, and diluted sepia linework; natural human proportions;
subtle paper grain; translucent sfumato washes of muted oxygen blue and warm venous red passing
through chest, abdomen, and pelvis; soft tonal transitions; calm, humane, observational, and
non-clinical. Keep the figure centered with generous empty parchment around it.

Do not add words, labels, diagrams, UI, buttons, borders, circles, halos, grids, medical symbols,
extra limbs, jewelry, scenery, or a photographic cutout. Do not paste the selfie onto a drawn
body. Redraw the entire person as one coherent manuscript artwork. Output one vertical image.`;

type GatewayResponse = {
  choices?: Array<{ message?: { images?: Array<{ image_url?: { url?: string } }> } }>;
};

export const Route = createFileRoute("/api/somatic-figure")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { selfie?: unknown };
          const selfie = typeof body.selfie === "string" ? body.selfie : "";
          if (!selfie.startsWith("data:image/") || selfie.length > MAX_SELFIE_LENGTH) {
            return Response.json({ error: "Choose one clear selfie under 15 MB." }, { status: 400 });
          }

          const token = process.env.AI_GATEWAY_API_KEY
            || process.env.VERCEL_OIDC_TOKEN
            || request.headers.get("x-vercel-oidc-token");
          if (!token) {
            console.error("[somatic-figure] AI Gateway identity unavailable");
            return Response.json({ error: "Figure generation is not configured yet." }, { status: 503 });
          }

          const gatewayResponse = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: MODEL,
              messages: [{
                role: "user",
                content: [
                  { type: "text", text: FIGURE_PROMPT },
                  { type: "image_url", image_url: { url: selfie, detail: "high" } },
                ],
              }],
              modalities: ["text", "image"],
              stream: false,
            }),
          });

          if (!gatewayResponse.ok) {
            const diagnostic = (await gatewayResponse.text()).slice(0, 500);
            console.error("[somatic-figure] gateway rejected generation", gatewayResponse.status, diagnostic);
            return Response.json(
              { error: "Your figure could not be drawn just now. Please try again." },
              { status: 502 },
            );
          }

          const result = (await gatewayResponse.json()) as GatewayResponse;
          const figure = result.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (!figure || (!figure.startsWith("data:image/") && !figure.startsWith("https://"))) {
            console.error("[somatic-figure] gateway returned no image");
            return Response.json({ error: "No figure was returned. Please try again." }, { status: 502 });
          }
          return Response.json({ figure });
        } catch (error) {
          console.error("[somatic-figure] generation failed", error);
          return Response.json(
            { error: "Your figure could not be drawn just now. Please try again." },
            { status: 500 },
          );
        }
      },
    },
  },
});
