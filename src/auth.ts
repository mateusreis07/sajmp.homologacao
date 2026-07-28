import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Usuário", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { username: credentials.username as string },
          include: { tenant: true },
        })

        if (!user) return null

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.senha
        )

        if (passwordsMatch) {
          return {
            id: user.id,
            name: user.nome,
            username: user.username,
            role: user.role,
            tenantId: user.tenantId ?? undefined,
            tenantSlug: user.tenant?.slug ?? undefined,
          } as any
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
        token.role = user.role
        token.tenantId = user.tenantId
        token.tenantSlug = user.tenantSlug
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.role = token.role as string
        session.user.tenantId = token.tenantId as string | undefined
        session.user.tenantSlug = token.tenantSlug as string | undefined
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
})
