import { describe, it, expect } from "vitest";
import { isSafeHttpUrl } from "./url";

describe("isSafeHttpUrl", () => {
  it("accepte http et https", () => {
    expect(isSafeHttpUrl("http://example.com")).toBe(true);
    expect(isSafeHttpUrl("https://example.com/path?query=1")).toBe(true);
  });

  it("rejette javascript:", () => {
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
  });

  it("rejette data:", () => {
    expect(isSafeHttpUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("rejette les autres schémas (ftp, mailto...)", () => {
    expect(isSafeHttpUrl("ftp://example.com/file")).toBe(false);
    expect(isSafeHttpUrl("mailto:test@example.com")).toBe(false);
  });

  it("rejette une chaîne qui n'est pas une URL valide", () => {
    expect(isSafeHttpUrl("not a url")).toBe(false);
    expect(isSafeHttpUrl("")).toBe(false);
  });

  it("rejette une URL relative sans schéma", () => {
    expect(isSafeHttpUrl("/relative/path")).toBe(false);
  });
});
