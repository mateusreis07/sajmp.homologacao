import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const nextUrl = req.nextUrl
  const pathname = nextUrl.pathname

  const isAuthRoute = pathname.startsWith("/login")
  const isApiAuthRoute = pathname.startsWith("/api/auth")

  // Allow next-auth API routes
  if (isApiAuthRoute) return NextResponse.next()

  // Redirect to dashboard if trying to login while already logged in
  if (isAuthRoute) {
    if (isLoggedIn) {
      const slug = req.auth?.user.tenantSlug
      if (slug) {
        return NextResponse.redirect(new URL(`/${slug}/dashboard`, nextUrl))
      } else if (req.auth?.user.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL(`/admin`, nextUrl))
      }
    }
    return NextResponse.next()
  }

  // If not logged in, redirect to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  // Handle Multi-tenant URLs (/[tenantSlug]/...)
  // We want to ensure the user can only access their own tenant slug
  const tenantSlug = req.auth?.user.tenantSlug
  const role = req.auth?.user.role

  if (role === "SUPER_ADMIN") {
    // Super admins can access /admin AND any tenant page for oversight
    // No restriction needed
  } else {
    // Regular users MUST have a tenantSlug and access their own URLs
    if (tenantSlug) {
      // If they go to root "/", redirect to their dashboard
      if (pathname === "/") {
        return NextResponse.redirect(new URL(`/${tenantSlug}/dashboard`, nextUrl))
      }

      // Check if they are trying to access another tenant's URL
      const pathSegment = pathname.split("/")[1]
      if (pathSegment && pathSegment !== tenantSlug && pathSegment !== "api") {
        return NextResponse.redirect(new URL(`/${tenantSlug}/dashboard`, nextUrl))
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
