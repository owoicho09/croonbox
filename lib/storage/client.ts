"use client";

import { createClient } from "@supabase/supabase-js";

let client: ReturnType<typeof createClient> | undefined;

export function getBrowserStorageClient() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set");
    }
    client = createClient(url, anonKey, { auth: { persistSession: false } });
  }
  return client;
}

export async function uploadToSignedUrl(bucket: string, path: string, token: string, file: Blob) {
  const { error } = await getBrowserStorageClient().storage.from(bucket).uploadToSignedUrl(path, token, file);
  if (error) throw error;
}
