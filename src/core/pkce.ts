export interface Pkce {
  verifier: string;
  challenge: string;
  method: "S256";
}

function to_base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function create_pkce(): Promise<Pkce> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const verifier = to_base64url(bytes);
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return {
    verifier,
    challenge: to_base64url(new Uint8Array(digest)),
    method: "S256",
  };
}
