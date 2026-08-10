import { encode } from "next-auth/jwt";
import type { BrowserContext } from "@playwright/test";
import type { User } from "@prisma/client";

// Contourne le flux OAuth Discord réel (impossible à automatiser dans un
// test) en signant directement un cookie de session NextAuth valide, avec
// le même NEXTAUTH_SECRET que le serveur de dev lancé par Playwright — voir
// CLAUDE.md pour pourquoi authOptions n'est pas touché pour ça.
export async function signInAs(context: BrowserContext, user: User) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET manquant — vérifiez .env.test");

  const baseURL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const domain = new URL(baseURL).hostname;
  const secureCookie = baseURL.startsWith("https://");

  const token = await encode({
    token: { userId: user.id, name: user.discordTag, sub: user.discordId },
    secret
  });

  await context.addCookies([
    {
      name: secureCookie ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      value: token,
      domain,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      secure: secureCookie
    }
  ]);
}
