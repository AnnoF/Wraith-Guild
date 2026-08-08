import { describe, it, expect } from "vitest";
import { youtubeEmbedUrl } from "./youtube";

describe("youtubeEmbedUrl", () => {
  it("convertit un lien youtu.be en URL d'embed", () => {
    expect(youtubeEmbedUrl("https://youtu.be/abc123")).toBe(
      "https://www.youtube.com/embed/abc123"
    );
  });

  it("convertit un lien youtube.com/watch?v= en URL d'embed", () => {
    expect(youtubeEmbedUrl("https://www.youtube.com/watch?v=abc123")).toBe(
      "https://www.youtube.com/embed/abc123"
    );
  });

  it("laisse passer un lien déjà en /embed/ tel quel", () => {
    const url = "https://www.youtube.com/embed/abc123";
    expect(youtubeEmbedUrl(url)).toBe(url);
  });

  it("retourne null pour un lien youtu.be sans identifiant", () => {
    expect(youtubeEmbedUrl("https://youtu.be/")).toBeNull();
  });

  it("retourne null pour un lien watch sans paramètre v", () => {
    expect(youtubeEmbedUrl("https://www.youtube.com/watch")).toBeNull();
  });

  it("retourne null pour une URL non-YouTube", () => {
    expect(youtubeEmbedUrl("https://example.com/video")).toBeNull();
  });

  it("retourne null pour une chaîne qui n'est pas une URL valide", () => {
    expect(youtubeEmbedUrl("not a url")).toBeNull();
  });
});
