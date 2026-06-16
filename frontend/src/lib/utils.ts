import { cn as legacyCn } from "../utils/cn";

// shadcn-compatible helper. We keep behavior aligned with the existing codebase `cn`.
export function cn(...inputs: Array<string | false | null | undefined>) {
  return legacyCn(...inputs);
}

