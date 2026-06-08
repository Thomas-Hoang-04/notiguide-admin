import { describe, expect, it } from "vitest";
import {
  getFirstMissingPasswordRequirementKey,
  getPasswordRequirementStatuses,
} from "@/lib/password-validation";

describe("password-validation", () => {
  it("marks every requirement passed for a strong password", () => {
    const statuses = getPasswordRequirementStatuses("Abcdef1!");
    expect(statuses.every((s) => s.passed)).toBe(true);
    expect(getFirstMissingPasswordRequirementKey("Abcdef1!")).toBeNull();
  });

  it("flags the missing uppercase requirement", () => {
    const statuses = getPasswordRequirementStatuses("abcdef1!");
    expect(
      statuses.find((s) => s.requirementKey === "reqUppercase")?.passed,
    ).toBe(false);
  });

  it("returns the first missing requirement key", () => {
    expect(getFirstMissingPasswordRequirementKey("abcdef1!")).toBe(
      "reqUppercase",
    );
  });
});
