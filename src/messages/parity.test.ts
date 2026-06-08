import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";

type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

function leafEntries(obj: Json, prefix = ""): [string, string][] {
  if (typeof obj === "string") return [[prefix, obj]];
  if (obj && typeof obj === "object") {
    return Object.entries(obj).flatMap(([k, v]) =>
      leafEntries(v as Json, prefix ? `${prefix}.${k}` : k),
    );
  }
  return [];
}

const tagsOf = (s: string) =>
  (s.match(/<\/?[a-zA-Z]+>/g) ?? []).map((t) => t.replace("/", "")).sort();
const countP = (s: string) => (s.match(/<p>/g) ?? []).length;

const enLeaves = new Map(leafEntries(en as Json));
const viLeaves = new Map(leafEntries(vi as Json));

describe("web i18n parity", () => {
  it("en and vi share identical key sets", () => {
    expect([...viLeaves.keys()].sort()).toEqual([...enLeaves.keys()].sort());
  });

  it("each leaf has matching <p> counts and rich-text tags across languages", () => {
    for (const [key, enValue] of enLeaves) {
      const viValue = viLeaves.get(key);
      if (viValue === undefined) continue;
      expect(countP(viValue), `<p> count for ${key}`).toBe(countP(enValue));
      expect(tagsOf(viValue), `tags for ${key}`).toEqual(tagsOf(enValue));
    }
  });
});
