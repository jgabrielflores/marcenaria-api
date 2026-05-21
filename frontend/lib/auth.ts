import { type UserRead } from "@/lib/api";
import { TOKEN_KEY, USER_KEY } from "@/lib/constants";

type JwtPayload = { sub: string; role: "CUSTOMER" | "ADMIN"; exp: number };

function decodeToken(token: string): JwtPayload | null {
  try {
    return JSON.parse(atob(token.split(".")[1])) as JwtPayload;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user?: UserRead | null): void {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax${secure}`;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  localStorage.removeItem(USER_KEY);
}

export function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${TOKEN_KEY}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getUser(): UserRead | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as UserRead) : null;
}

export function isAdmin(): boolean {
  const user = getUser();
  if (user) return user.role === "ADMIN";
  const token = getToken();
  return token ? (decodeToken(token)?.role === "ADMIN") === true : false;
}
