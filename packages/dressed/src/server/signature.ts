import nacl from "tweetnacl";
import { Buffer } from "node:buffer";
import { botEnv } from "../utils/env.ts";

/**
 * Verifies the signature of the POST request
 */
export function verifySignature(
  body: string,
  signature?: string | string[] | null,
  timestamp?: string | string[] | null,
): boolean {
  if (
    !signature ||
    !timestamp ||
    typeof signature !== "string" ||
    typeof timestamp !== "string"
  ) {
    return false;
  }

  return nacl.sign.detached.verify(
    new Uint8Array(Buffer.from(timestamp + body)),
    new Uint8Array(Buffer.from(signature, "hex")),
    new Uint8Array(Buffer.from(botEnv.DISCORD_PUBLIC_KEY, "hex")),
  );
}
