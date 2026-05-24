import NextAuth from "next-auth";

import GoogleProvider from "next-auth/providers/google";

import GitHubProvider from "next-auth/providers/github";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,

      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,

      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/save-user`, {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: user.name,
            email: user.email,
            image: user.image,
            provider: account?.provider,
            oauth_id: account?.providerAccountId,
          }),
        });

        return true;
      } catch (error) {
        console.log(error);

        return true;
      }
    },

    async jwt({ token, user }) {
      const email = user?.email || token.email;

      if (email) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/${email}`,
          );

          if (res.ok) {
            const data = await res.json();

            token.role = data.role || "user";

            token.dbId = data.id;
          }
        } catch (error) {
          console.log(error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.dbId as string;

        session.user.role = (token.role as string) || "user";
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
