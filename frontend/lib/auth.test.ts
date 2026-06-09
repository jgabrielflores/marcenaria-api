import { beforeEach, describe, expect, it } from "vitest";

import { clearSession, getToken, getUser, isAdmin, saveSession } from "./auth";
import { TOKEN_KEY } from "./constants";
import type { UserRead } from "./api";

function makeToken(role: "ADMIN" | "CUSTOMER"): string {
  const payload = btoa(JSON.stringify({ sub: "1", role, exp: 9_999_999_999 }));
  return `header.${payload}.signature`;
}

function user(role: "ADMIN" | "CUSTOMER"): UserRead {
  return { id: "1", name: "Alice", email: "alice@test.com", role, created_at: "2026-01-01" };
}

beforeEach(() => {
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
  localStorage.clear();
});

describe("session storage", () => {
  it("saves the token to the cookie and reads it back", () => {
    saveSession("abc.def.ghi");
    expect(getToken()).toBe("abc.def.ghi");
  });

  it("persists the user in localStorage when provided", () => {
    saveSession("t.t.t", user("CUSTOMER"));
    expect(getUser()).toEqual(user("CUSTOMER"));
  });

  it("clearSession removes both the token and the cached user", () => {
    saveSession("t.t.t", user("CUSTOMER"));
    clearSession();
    expect(getToken()).toBeNull();
    expect(getUser()).toBeNull();
  });
});

describe("isAdmin", () => {
  it("is true for an ADMIN user cached in localStorage", () => {
    saveSession(makeToken("ADMIN"), user("ADMIN"));
    expect(isAdmin()).toBe(true);
  });

  it("is false for a CUSTOMER user", () => {
    saveSession(makeToken("CUSTOMER"), user("CUSTOMER"));
    expect(isAdmin()).toBe(false);
  });

  it("falls back to decoding the JWT role when no user is cached", () => {
    saveSession(makeToken("ADMIN")); // token only, no cached user
    expect(isAdmin()).toBe(true);
  });

  it("is false when there is neither a user nor a token", () => {
    expect(isAdmin()).toBe(false);
  });

  it("is false when the JWT payload cannot be decoded", () => {
    saveSession("not-a-valid-jwt"); // split('.')[1] is undefined → decode throws → null
    expect(isAdmin()).toBe(false);
  });
});
