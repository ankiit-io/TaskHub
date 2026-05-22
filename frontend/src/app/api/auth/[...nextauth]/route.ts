import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { supabase } from "@/lib/supabase";
import { saveUser } from "@/lib/saveUser";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async signIn({ user }) {
      await saveUser(user);

      return true;
    },

    async jwt({ token }) {
      if (token.email) {
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("email", token.email)
          .single();

        token.role = data?.role;
        token.id = data?.id;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
      }

      return session;
    },
  },
});

export { handler as GET, handler as POST };
