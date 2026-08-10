import { randomBytes } from "node:crypto";

export function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "workspace"
  );
}

export function slugWithSuffix(name: string) {
  return `${slugify(name)}-${randomBytes(3).toString("hex")}`;
}
