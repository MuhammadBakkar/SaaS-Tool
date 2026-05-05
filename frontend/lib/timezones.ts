export function getTimezoneOptions(): { value: string; label: string }[] {
  try {
    const tz =
      typeof Intl !== "undefined" && "supportedValuesOf" in Intl
        ? Intl.supportedValuesOf("timeZone")
        : [];
    return tz.map((value) => ({ value, label: value }));
  } catch {
    return [{ value: "UTC", label: "UTC" }];
  }
}

export function defaultTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  } catch {
    return "UTC";
  }
}
