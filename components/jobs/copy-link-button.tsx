"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyLinkButton({ url, label = "Copy Link" }: { url: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied — nothing useful to do beyond leaving the button unchanged.
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" className="w-auto" onClick={handleClick}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}
