/**
 * Client-side validation – aligned with backend auth schemas
 */
export const PASSWORD_MIN = 8;
const hasUpper = (s: string) => /[A-Z]/.test(s);
const hasLower = (s: string) => /[a-z]/.test(s);
const hasNumber = (s: string) => /[0-9]/.test(s);
const hasSpecial = (s: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(s);

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(trimmed)) return 'Enter a valid email address';
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters`;
  if (!hasUpper(password)) return 'Password must contain at least one uppercase letter';
  if (!hasLower(password)) return 'Password must contain at least one lowercase letter';
  if (!hasNumber(password)) return 'Password must contain at least one number';
  if (!hasSpecial(password)) return 'Password must contain at least one special character';
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return 'Name is required';
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return 'Phone number is required';
  return null;
}

export function validateOtp(otp: string): string | null {
  if (!/^\d{6}$/.test(otp.trim())) return 'Enter the 6-digit code';
  return null;
}

export type AuthErrors = {
  email?: string;
  password?: string;
  name?: string;
  phone?: string;
  otp?: string;
  newPassword?: string;
  currentPassword?: string;
};

export function validateLogin(email: string, password: string): AuthErrors {
  const errors: AuthErrors = {};
  const e = validateEmail(email);
  if (e) errors.email = e;
  if (!password) errors.password = 'Password is required';
  return errors;
}

export function validateSignup(
  name: string,
  email: string,
  phone: string,
  password: string
): AuthErrors {
  const errors: AuthErrors = {};
  const n = validateName(name);
  if (n) errors.name = n;
  const e = validateEmail(email);
  if (e) errors.email = e;
  const p = validatePhone(phone);
  if (p) errors.phone = p;
  const pw = validatePassword(password);
  if (pw) errors.password = pw;
  return errors;
}

export function validateResetPassword(otp: string, newPassword: string): AuthErrors {
  const errors: AuthErrors = {};
  const o = validateOtp(otp);
  if (o) errors.otp = o;
  const pw = validatePassword(newPassword);
  if (pw) errors.newPassword = pw;
  return errors;
}

export function validateChangePassword(currentPassword: string, newPassword: string): AuthErrors {
  const errors: AuthErrors = {};
  if (!currentPassword) errors.currentPassword = 'Current password is required';
  const pw = validatePassword(newPassword);
  if (pw) errors.newPassword = pw;
  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.newPassword = 'New password must be different';
  }
  return errors;
}
