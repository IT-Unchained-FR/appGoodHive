import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions } from "next-auth";
import { v4 as uuidv4, validate as validateUuid } from "uuid";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "", {
  ssl: {
    rejectUnauthorized: false, // This allows connecting to a database with a self-signed certificate
  },
});
export const authOptions: AuthOptions = {
  secret: process.env.AUTH_SECRET,
  providers: [
    GoogleProvider({
      // Configure Google Provider
      clientId: process.env.GOOGLE_CLIENT_ID as string, // From .env
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, // From .env
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email: credentials?.email,
                password: credentials?.password,
              }),
            },
          );

          const data = await response.json();

          if (response.ok && data?.user) {
            // Return the user data that will be stored in the token
            return {
              id: data.user.userid,
              email: data.user.email,
              name: `${data.user.first_name} ${data.user.last_name}`,
              userData: data.user, // Store the complete user data
            };
          }

          // If the response is not ok, return null to indicate authentication failure
          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      console.log(token, "token");
      if (account) {
        console.log(account, "account");
        token.id_token = account.id_token;
      }

      if (user) {
        const google_id = !validateUuid(user.id);

        if (google_id) {
          const user_data = await sql`
            SELECT * 
              FROM goodhive.users 
              WHERE google_auth_id = ${user.id}
              LIMIT 1;
          `;

          token.userId = user_data[0].userid;
        } else {
          // Add user data to the token
          token.userId = user.id;
        }
        //@ts-ignore
        token.userData = user.userData;
      }
      return token;
    },
    async session({ session, token }) {
      //@ts-ignore
      session.id_token = token.id_token;
      //@ts-ignore
      session.userId = token.userId;
      //@ts-ignore
      session.userData = token.userData;
      return session;
    },
  },
  pages: {
    signIn: "/auth/login", // Custom signin page path
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
