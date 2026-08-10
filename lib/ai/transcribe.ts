import "server-only";
import { getOpenAI } from "@/lib/ai/openai";
import { downloadStorageObject } from "@/lib/storage";

export async function transcribeVideo(storagePath: string, mimeType: string) {
  const blob = await downloadStorageObject(storagePath);
  const extension = mimeType.includes("mp4") ? "mp4" : "webm";
  const file = new File([await blob.arrayBuffer()], `response.${extension}`, { type: mimeType });

  const result = await getOpenAI().audio.transcriptions.create({
    file,
    model: process.env.OPENAI_TRANSCRIBE_MODEL ?? "whisper-1",
  });

  return result.text;
}
