export function passwordValidationErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Use at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Add one uppercase letter (A–Z)');
  if (!/[a-z]/.test(password)) errors.push('Add one lowercase letter (a–z)');
  if (!/[0-9]/.test(password)) errors.push('Add one number (0–9)');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Add one special character (e.g. !@#$%)');
  return errors;
}

export function isStrongPassword(password: string): boolean {
  return passwordValidationErrors(password).length === 0;
}
