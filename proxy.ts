import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Invoices and dashboard may only be reached by signed-in users.
// Sending someone to one of these routes while signed out redirects to /sign-in.
function isProtectedRoute(pathname: string) {
  return (
    pathname === "/invoices" ||
    pathname.startsWith("/invoices/") ||
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/")
  );
}

export function proxy(req: NextRequest) {
  if (isProtectedRoute(req.nextUrl.pathname)) {
    const sessionCookie = getSessionCookie(req);
    if (!sessionCookie) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set(
        "redirect_url",
        `${req.nextUrl.pathname}${req.nextUrl.search}`,
      );
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
