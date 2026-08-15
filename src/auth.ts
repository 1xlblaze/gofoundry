import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Keycloak from "next-auth/providers/keycloak";
import { getUserTierByEmail } from "@/lib/db";
import type { UserTier } from "@/lib/stripe";

const providers = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (
  process.env.KEYCLOAK_CLIENT_ID &&
  process.env.KEYCLOAK_CLIENT_SECRET &&
  process.env.KEYCLOAK_ISSUER
) {
  providers.push(
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
      issuer: process.env.KEYCLOAK_ISSUER,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  secret:
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "gofoundry-local-dev-auth-secret-min-32-chars"
      : undefined),
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token }) {
      if (token.email) {
        token.tier = (await getUserTierByEmail(token.email)) as UserTier;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      if (session.user && token.tier) {
        session.user.tier = token.tier as UserTier;
      }
      return session;
    },
  },
  trustHost: true,
});

export const authConfigured = providers.length > 0;
