import "server-only";
import { createClient } from "@supabase/supabase-js";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "candidate-videos";

let client: ReturnType<typeof createClient> | undefined;
function admin() {
  if (!client) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
    }
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
}

export async function createSignedUploadUrl(path: string) {
  const { data, error } = await admin().storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) throw error;
  return { path: data.path, token: data.token, signedUrl: data.signedUrl, bucket: BUCKET };
}

export async function createSignedPlaybackUrl(path: string, expiresInSeconds = 3600) {
  const { data, error } = await admin().storage.from(BUCKET).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function deleteStorageObject(path: string) {
  await admin().storage.from(BUCKET).remove([path]);
}

export async function downloadStorageObject(path: string) {
  const { data, error } = await admin().storage.from(BUCKET).download(path);
  if (error) throw error;
  return data;
}
