import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions } from "next-auth";
import { v4 as uuidv4, validate as validateUuid } from "uuid";
import postgres from "postgres";

// Extend the Session type
declare module "next-auth" {
  interface Session {
    id_token?: string;
    user_id: string;
    email: string;
    expires: string;
  }
}

// Extend the JWT type
declare module "next-auth/jwt" {
  interface JWT {
    id_token?: string;
    userId: string;
    email: string;
  }
}

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
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    CredentialsProvider({
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
        verified: { label: "Verified", type: "text" },
        userId: { label: "User ID", type: "text" },
      },
      async authorize(credentials) {
        console.log(credentials, "credentials...");
        try {
          if (!credentials?.email || !credentials?.otp) {
            return null;
          }

          console.log(credentials, "credentials...");
          // Check if credentials include verified=true and userId
          if (credentials?.verified === "true" && credentials?.userId) {
            // Get user data
            const userQuery = await sql`
              SELECT * FROM goodhive.users WHERE userid = ${credentials.userId} LIMIT 1
            `;
            const user = userQuery[0];

            if (userQuery.length > 0) {
              return {
                id: user.id ? user.id : "123",
                email: user.email,
                user_id: user.userid,
              };
            }

            // User doesn't exist, create a new user
            try {
              const userId = validateUuid(credentials.userId)
                ? credentials.userId
                : uuidv4();

              const newUser = await sql`
                INSERT INTO goodhive.users (userid, email, created_at, updated_at)
                VALUES (${userId}, ${credentials.email}, NOW(), NOW())
                RETURNING *;
              `;

              console.log("Created new user via credentials:", newUser);

              if (newUser.length > 0) {
                return {
                  id: newUser[0].id ? newUser[0].id : userId,
                  email: newUser[0].email,
                  user_id: newUser[0].userid,
                };
              }
            } catch (error) {
              console.error(
                "Failed to create new user via credentials:",
                error,
              );
            }

            // Return minimal user if no full profile or insert failed
            return {
              id: credentials.userId,
              email: credentials.email,
              user_id: credentials.userId,
            };
          }

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
      console.log(token, "token", user, "user", account, "account");
      if (account) {
        token.id_token = account.id_token;
      }

      // Always try to get user data from database using email
      const email = user?.email || token.email;
      if (email) {
        const user_data = await sql`
          SELECT * 
            FROM goodhive.users 
            WHERE email = ${email as string}
            LIMIT 1;
        `;
        console.log(user_data, "user_data");

        if (user_data.length > 0) {
          // User exists, use their data
          token.userId = user_data[0]?.userid;
          token.email = user_data[0]?.email;
        } else {
          // User doesn't exist, create a new user record
          try {
            const newUser = await sql`
              INSERT INTO goodhive.users (email)
              VALUES (${email})
              RETURNING *;
            `;

            console.log(newUser, "newUser");

            if (newUser.length > 0) {
              token.userId = newUser[0]?.userid;
              token.email = newUser[0]?.email;
            } else {
              // Fallback if insert fails
              token.userId = user.id;
              token.email = email;
            }
          } catch (error) {
            console.error("Failed to create new user:", error);
            // Fallback
            token.userId = user.id;
            token.email = email;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.id_token = token.id_token;
      session.user_id = token.userId;
      session.email = token.email;
      session.expires = token.exp?.toString() || new Date().toISOString();
      console.log(session, "session.......", token, "token.......");

      return session;
    },
  },
  pages: {
    signIn: "/auth/login", // Custom signin page path
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
