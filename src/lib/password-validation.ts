export type PasswordRequirementKey =
  | "reqUppercase"
  | "reqLowercase"
  | "reqDigit"
  | "reqSpecial";

type PasswordRequirement = {
  requirementKey: PasswordRequirementKey;
  regex: RegExp;
};

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    requirementKey: "reqUppercase",
    regex: /[A-Z]/,
  },
  {
    requirementKey: "reqLowercase",
    regex: /[a-z]/,
  },
  {
    requirementKey: "reqDigit",
    regex: /\d/,
  },
  {
    requirementKey: "reqSpecial",
    regex: /[^a-zA-Z0-9\s]/,
  },
];

export type PasswordRequirementStatus = {
  requirementKey: PasswordRequirementKey;
  passed: boolean;
};

export function getPasswordRequirementStatuses(
  password: string,
): PasswordRequirementStatus[] {
  return PASSWORD_REQUIREMENTS.map((requirement) => ({
    requirementKey: requirement.requirementKey,
    passed: requirement.regex.test(password),
  }));
}

export function getFirstMissingPasswordRequirementKey(password: string) {
  return (
    PASSWORD_REQUIREMENTS.find(
      (requirement) => !requirement.regex.test(password),
    )?.requirementKey ?? null
  );
}
