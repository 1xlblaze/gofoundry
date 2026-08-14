import { auth } from "@/auth";
import type { UserTier } from "@/lib/stripe";

export async function getUserTier(): Promise<UserTier> {
  const session = await auth();
  const tier = session?.user?.tier;
  if (tier === "pro" || tier === "cohort") return tier;
  return "free";
}

export async function requirePro(): Promise<{ ok: true; tier: UserTier } | { ok: false }> {
  const tier = await getUserTier();
  if (tier === "pro" || tier === "cohort") return { ok: true, tier };
  return { ok: false };
}
