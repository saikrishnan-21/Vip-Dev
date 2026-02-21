import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    "/login",
    "/register",
    "/reset-password",
    "/api/auth/register",
    "/api/auth/login",
  ];

  // Check if the route is public exactly or starts with the API auth routes
  const isPublicRoute =
    pathname === "/" ||
    publicRoutes.some(
      (route) => pathname === route || pathname.startsWith("/api/auth/"),
    );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected API routes - check for authentication
  // Note: Dashboard pages are client-side and handle auth in layout (can't access localStorage in middleware)
  if (pathname.startsWith("/api/")) {
    // Skip protection for public API routes already handled above
    if (pathname.startsWith("/api/auth/")) return NextResponse.next();

    // Get token from Authorization header (Next.js way - simple, standard JWT pattern)
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : null;

    // If no token, return 401
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 },
      );
    }

    // Token is valid, allow request to proceed
    return NextResponse.next();
  }

  // Dashboard pages - let client-side handle auth (middleware can't access localStorage)
  // The dashboard layout will check auth and redirect if needed
  if (pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // Allow all other requests
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register", "/api/:path*"],
};
