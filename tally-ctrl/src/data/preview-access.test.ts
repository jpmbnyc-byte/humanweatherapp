import { describe, expect, it } from "vitest";
import {
  decodePayloadToken,
  encodePayloadToken,
  mailMergeTemplate,
  mintPreviewLinks,
  parseHostSlug,
  resolvePreviewAccess,
  slugify,
  TEMPLATE_TOKEN,
} from "@/data/preview-access";

describe("preview access templates", () => {
  it("slugifies prospect names", () => {
    expect(slugify("Faulkner Automotive Group")).toBe("faulkner-automotive-group");
  });

  it("round-trips a minted payload token", () => {
    const token = encodePayloadToken({
      prospectName: "Acme Auto Group",
      slug: "acme-auto",
      franchise: "toyota",
      sampleUnitCount: 175,
      days: 21,
    });
    expect(token.startsWith("t1.")).toBe(true);
    const decoded = decodePayloadToken(token);
    expect(decoded?.prospectName).toBe("Acme Auto Group");
    expect(decoded?.slug).toBe("acme-auto");
    expect(decoded?.franchise).toBe("toyota");
    expect(decoded?.sampleUnitCount).toBe(175);
    expect(decoded?.expiresAt).toBeTruthy();
  });

  it("resolves registry tokens and slugs", () => {
    expect(resolvePreviewAccess({ token: "demo-faulkner" })?.prospectName).toBe(
      "Faulkner Automotive Group",
    );
    expect(resolvePreviewAccess({ token: "faulkner" })?.slug).toBe("faulkner");
  });

  it("resolves mail-merge query template /p/c?name=", () => {
    const record = resolvePreviewAccess({
      token: TEMPLATE_TOKEN,
      search: "name=Harbor%20Motors&franchise=bmw&units=160&slug=harbor",
    });
    expect(record?.prospectName).toBe("Harbor Motors");
    expect(record?.franchise).toBe("bmw");
    expect(record?.sampleUnitCount).toBe(160);
    expect(record?.slug).toBe("harbor");
  });

  it("resolves vanity subdomain slugs against the registry", () => {
    const record = resolvePreviewAccess({
      token: "",
      hostname: "faulkner.preview.tallyctrl.com",
    });
    expect(record?.prospectName).toBe("Faulkner Automotive Group");
  });

  it("parses host slugs", () => {
    expect(parseHostSlug("faulkner.preview.tallyctrl.com")).toBe("faulkner");
    expect(parseHostSlug("preview.tallyctrl.com")).toBeNull();
    expect(parseHostSlug("www.preview.tallyctrl.com")).toBeNull();
  });

  it("builds mint links and a mail-merge template", () => {
    const links = mintPreviewLinks({
      prospectName: "Riverside Ford Family",
      slug: "riverside-ford",
      franchise: "ford",
      sampleUnitCount: 220,
    });
    expect(links.pathUrl).toContain("/p/t1.");
    expect(links.templateUrl).toContain(`/p/${TEMPLATE_TOKEN}?`);
    expect(links.subdomainUrl).toContain("riverside-ford.preview.tallyctrl.com");
    expect(mailMergeTemplate()).toContain("{{company_name}}");
  });
});
