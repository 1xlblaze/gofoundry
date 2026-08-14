import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id?: string;
      tier?: "free" | "pro" | "cohort";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    tier?: "free" | "pro" | "cohort";
  }
}
