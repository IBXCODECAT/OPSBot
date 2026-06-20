export async function verifyDiscordRequest(
  request: Request,
  publicKeyHex: string
): Promise<{ valid: boolean; body: string }> {
  const signature = request.headers.get("x-signature-ed25519");
  const timestamp = request.headers.get("x-signature-timestamp");

  if (!signature || !timestamp) {
    return { valid: false, body: "" };
  }

  const body = await request.text();

  const publicKeyBytes = hexToUint8Array(publicKeyHex);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    publicKeyBytes.buffer as ArrayBuffer,
    { name: "Ed25519" },
    false,
    ["verify"]
  );

  const message = new TextEncoder().encode(timestamp + body);
  const signatureBytes = hexToUint8Array(signature);

  const valid = await crypto.subtle.verify(
    { name: "Ed25519" },
    cryptoKey,
    signatureBytes.buffer as ArrayBuffer,
    message.buffer as ArrayBuffer
  );

  return { valid, body };
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}
