import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      username: string
      role: string
      tenantId?: string
      tenantSlug?: string
    } & DefaultSession["user"]
  }

  interface User {
    username: string
    role: string
    tenantId?: string
    tenantSlug?: string
  }
}
