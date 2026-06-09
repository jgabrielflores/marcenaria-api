import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  changePassword,
  createOrder,
  getDashboard,
  getMe,
  getOrder,
  listOrders,
  login,
  register,
  resendVerification,
  updateMe,
  updateOrderAdmin,
} from "./api";

const BASE = "http://localhost:8000";

function fetchReturning(status: number, body: unknown, ok = status < 400) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("request error handling", () => {
  it("normalizes a 422 validation array to a friendly PT message", async () => {
    vi.stubGlobal("fetch", fetchReturning(422, { detail: [{ msg: "field required" }] }));
    await expect(login({ email: "a@b.com", password: "x" })).rejects.toMatchObject({
      status: 422,
      message: "Dados inválidos. Verifique os campos preenchidos.",
    });
  });

  it("passes a string detail through unchanged", async () => {
    vi.stubGlobal("fetch", fetchReturning(400, { detail: "Senha atual incorreta" }));
    await expect(
      changePassword("token", { current_password: "a", new_password: "bbbbbbbb" }),
    ).rejects.toMatchObject({ status: 400, message: "Senha atual incorreta" });
  });

  it("uses a fallback message when the error body has no detail", async () => {
    vi.stubGlobal("fetch", fetchReturning(500, {}));
    await expect(login({ email: "a@b.com", password: "x" })).rejects.toMatchObject({
      status: 500,
      message: "Erro inesperado.",
    });
  });
});

describe("request success handling", () => {
  it("returns undefined for a 204 No Content response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, status: 204, json: async () => ({}) }),
    );
    await expect(
      changePassword("token", { current_password: "a", new_password: "bbbbbbbb" }),
    ).resolves.toBeUndefined();
  });

  it("returns the parsed JSON body on success", async () => {
    vi.stubGlobal("fetch", fetchReturning(200, { access_token: "tok", token_type: "bearer" }));
    await expect(login({ email: "a@b.com", password: "x" })).resolves.toEqual({
      access_token: "tok",
      token_type: "bearer",
    });
  });
});

describe("ApiError", () => {
  it("carries the HTTP status and display message", () => {
    const err = new ApiError(403, "forbidden");
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(403);
    expect(err.message).toBe("forbidden");
  });
});

describe("endpoint wrappers issue the expected request", () => {
  function stub(body: unknown = {}) {
    const f = fetchReturning(200, body);
    vi.stubGlobal("fetch", f);
    return f;
  }
  const url = (f: ReturnType<typeof stub>) => f.mock.calls[0][0] as string;
  const opts = (f: ReturnType<typeof stub>) => f.mock.calls[0][1] as RequestInit;

  it("register → POST /auth/register", async () => {
    const f = stub({ id: "1" });
    await register({ name: "A", email: "a@b.com", password: "x" });
    expect(url(f)).toBe(`${BASE}/auth/register`);
    expect(opts(f).method).toBe("POST");
  });

  it("resendVerification → POST /auth/resend-verification", async () => {
    const f = stub({ detail: "ok" });
    await resendVerification("a@b.com");
    expect(url(f)).toBe(`${BASE}/auth/resend-verification`);
    expect(opts(f).method).toBe("POST");
  });

  it("getMe → GET /api/v1/me with Authorization header", async () => {
    const f = stub({ id: "1" });
    await getMe("tok");
    expect(url(f)).toBe(`${BASE}/api/v1/me`);
    expect((opts(f).headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("updateMe → PATCH /api/v1/me", async () => {
    const f = stub({ id: "1" });
    await updateMe("tok", { name: "New" });
    expect(url(f)).toBe(`${BASE}/api/v1/me`);
    expect(opts(f).method).toBe("PATCH");
  });

  it("listOrders → GET /api/v1/orders with pagination and status filter", async () => {
    const f = stub({ items: [], total: 0, page: 1, limit: 20, pages: 0 });
    await listOrders("tok", { status: "APROVADO" });
    expect(url(f)).toBe(`${BASE}/api/v1/orders?page=1&limit=20&status=APROVADO`);
  });

  it("getOrder → GET /api/v1/orders/:id", async () => {
    const f = stub({ id: "abc" });
    await getOrder("tok", "abc");
    expect(url(f)).toBe(`${BASE}/api/v1/orders/abc`);
  });

  it("createOrder → POST /api/v1/orders", async () => {
    const f = stub({ id: "1" });
    await createOrder("tok", {
      whatsapp: "11999999999",
      cep: "01001-000",
      city: "São Paulo",
      state: "SP",
      environments: "Cozinha",
    });
    expect(url(f)).toBe(`${BASE}/api/v1/orders`);
    expect(opts(f).method).toBe("POST");
  });

  it("updateOrderAdmin → PATCH /api/v1/orders/:id", async () => {
    const f = stub({ id: "1" });
    await updateOrderAdmin("tok", "1", { status: "EM_PRODUCAO" });
    expect(url(f)).toBe(`${BASE}/api/v1/orders/1`);
    expect(opts(f).method).toBe("PATCH");
  });

  it("getDashboard → GET /api/v1/admin/dashboard with optional params", async () => {
    const f = stub({ counts_by_status: {} });
    await getDashboard("tok", { year: 2026, month: 6 });
    expect(url(f)).toBe(`${BASE}/api/v1/admin/dashboard?year=2026&month=6`);
  });

  it("getDashboard → no query string when params are omitted", async () => {
    const f = stub({ counts_by_status: {} });
    await getDashboard("tok");
    expect(url(f)).toBe(`${BASE}/api/v1/admin/dashboard`);
  });
});
