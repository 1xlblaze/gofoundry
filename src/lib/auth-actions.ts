"use server";

import { signIn, signOut } from "@/auth";

export async function googleSignIn() {
  await signIn("google", { redirectTo: "/learn" });
}

export async function keycloakSignIn() {
  await signIn("keycloak", { redirectTo: "/learn" });
}

export async function doSignOut() {
  await signOut({ redirectTo: "/" });
}
