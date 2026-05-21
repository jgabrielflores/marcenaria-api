import { NextResponse, type NextRequest } from "next/server";
import { TOKEN_KEY } from "@/lib/constants";

const PUBLIC_PATHS = ["/", "/login", "/register"];

function getRole(token: string): string | null {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).role ?? null;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Legacy /orders/* routes were replaced by the /conta area.
  if (pathname === "/orders" || pathname.startsWith("/orders/")) {
    const target = request.nextUrl.clone();
    target.pathname = "/conta/pedidos";
    return NextResponse.redirect(target);
  }

  if (PUBLIC_PATHS.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(TOKEN_KEY)?.value;

  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && getRole(token) !== "ADMIN") {
    const target = request.nextUrl.clone();
    target.pathname = "/conta/pedidos";
    return NextResponse.redirect(target);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
