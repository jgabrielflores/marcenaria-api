const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = Array.isArray(body.detail)
      ? "Dados inválidos. Verifique os campos preenchidos."
      : (body.detail ?? "Erro inesperado.");
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export type TokenResponse = { access_token: string; token_type: string };
export type UserRead = {
  id: string;
  name: string;
  email: string;
  role: "CUSTOMER" | "ADMIN";
  created_at: string;
};

export function register(body: {
  name: string;
  email: string;
  password: string;
}): Promise<UserRead> {
  return request("/auth/register", { method: "POST", body: JSON.stringify(body) });
}

export function login(body: { email: string; password: string }): Promise<TokenResponse> {
  return request("/auth/login", { method: "POST", body: JSON.stringify(body) });
}

export function resendVerification(email: string): Promise<{ detail: string }> {
  return request("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

// ── Profile ─────────────────────────────────────────────────────────────────

export function getMe(token: string): Promise<UserRead> {
  return request("/api/v1/me", {}, token);
}

export function updateMe(token: string, body: { name: string }): Promise<UserRead> {
  return request("/api/v1/me", { method: "PATCH", body: JSON.stringify(body) }, token);
}

export function changePassword(
  token: string,
  body: { current_password: string; new_password: string },
): Promise<void> {
  return request("/api/v1/me/password", { method: "PATCH", body: JSON.stringify(body) }, token);
}

// ── Orders ────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | "AGUARDANDO_ANALISE"
  | "EM_ORCAMENTO"
  | "APROVADO"
  | "EM_PRODUCAO"
  | "INSTALACAO_AGENDADA"
  | "CONCLUIDO"
  | "CANCELADO";

export type OrderHistoryEntry = {
  id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  note: string | null;
  created_at: string;
};

export type OrderRead = {
  id: string;
  order_number: number;
  user_id: string;
  // Populated only in the admin view; null for customers.
  customer_name: string | null;
  customer_email: string | null;
  status: OrderStatus;
  whatsapp: string;
  cep: string;
  city: string;
  state: string;
  address_line: string | null;
  environments: string;
  furniture_types: string | null;
  observations: string | null;
  // Money fields arrive as decimal strings (e.g. "8500.00") or null.
  project_value: string | null;
  estimated_cost: string | null;
  profit: string | null;
  admin_notes: string | null;
  due_date: string | null;
  install_date: string | null;
  created_at: string;
  updated_at: string;
  history: OrderHistoryEntry[];
};

export type PaginatedOrders = {
  items: OrderRead[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type OrderCreateBody = {
  whatsapp: string;
  cep: string;
  city: string;
  state: string;
  address_line?: string | null;
  environments: string;
  furniture_types?: string | null;
  observations?: string | null;
  // Honored only for admin-created orders.
  client_name?: string | null;
  client_email?: string | null;
};

export type OrderUpdateBody = {
  status?: OrderStatus;
  project_value?: string | null;
  estimated_cost?: string | null;
  due_date?: string | null;
  install_date?: string | null;
  admin_notes?: string | null;
  city?: string;
  state?: string;
  address_line?: string | null;
  whatsapp?: string | null;
  environments?: string | null;
  furniture_types?: string | null;
  observations?: string | null;
  note?: string | null;
};

export function listOrders(
  token: string,
  params: { page?: number; limit?: number; status?: OrderStatus } = {},
): Promise<PaginatedOrders> {
  const qs = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 20),
  });
  if (params.status) qs.set("status", params.status);
  return request(`/api/v1/orders?${qs}`, {}, token);
}

export function getOrder(token: string, id: string): Promise<OrderRead> {
  return request(`/api/v1/orders/${id}`, {}, token);
}

export function createOrder(token: string, body: OrderCreateBody): Promise<OrderRead> {
  return request("/api/v1/orders", { method: "POST", body: JSON.stringify(body) }, token);
}

export function updateOrderAdmin(
  token: string,
  id: string,
  body: OrderUpdateBody,
): Promise<OrderRead> {
  return request(`/api/v1/orders/${id}`, { method: "PATCH", body: JSON.stringify(body) }, token);
}

// ── Admin dashboard ───────────────────────────────────────────────────────────

export type DashboardSummary = {
  counts_by_status: Record<OrderStatus, number>;
  revenue_month: string;
  cost_month: string;
  profit_month: string;
  overdue_count: number;
  recent_orders: OrderRead[];
};

export function getDashboard(
  token: string,
  params?: { year?: number; month?: number },
): Promise<DashboardSummary> {
  const qs = new URLSearchParams();
  if (params?.year) qs.set("year", String(params.year));
  if (params?.month) qs.set("month", String(params.month));
  const query = qs.toString();
  return request(`/api/v1/admin/dashboard${query ? `?${query}` : ""}`, {}, token);
}
