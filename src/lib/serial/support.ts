export function hasWebSerialSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    typeof navigator !== "undefined" &&
    "serial" in navigator
  );
}
