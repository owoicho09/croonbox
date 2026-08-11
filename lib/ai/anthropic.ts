import "server-only";
import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | undefined;

export function getAnthropic() {
  if (!client) {
    if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}
