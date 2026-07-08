import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

const protectedRoutes = ["/account", "/admin"];
const authRoutes = ["/login", "/signup"];

function isProtectedRoute(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

function isAuthRoute(pathname: string) {
  return authRoutes.includes(pathname);
}

function getSafeNext(pathname: string, search: string) {
  const next = `${pathname}${search}`;

  return next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

function redirectWithCookies(url: URL, response: NextResponse) {
  const redirectResponse = NextResponse.redirect(url);

  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && isProtectedRoute(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", getSafeNext(pathname, search));

    return redirectWithCookies(url, supabaseResponse);
  }

  if (user && isAuthRoute(pathname)) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get("next") ?? "";
    const safeNext =
      next.startsWith("/") && !next.startsWith("//") ? next : "/account";

    // Allow ?next=/checkout etc. so authenticated users land on the page
    // they were trying to reach instead of being sent to /account.
    try {
      const target = new URL(safeNext, url.origin);
      url.pathname = target.pathname;
      url.search = target.search;
    } catch {
      url.pathname = "/account";
      url.search = "";
    }

    return redirectWithCookies(url, supabaseResponse);
  }

  return supabaseResponse;
}
