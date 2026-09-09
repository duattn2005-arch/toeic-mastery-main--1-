/**
 * Promotes an existing account (already signed in with Google at least
 * once) to ADMIN.
 * Usage: npm run db:promote-admin -- someone@example.com
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run db:promote-admin -- someone@example.com");
    process.exit(1);
  }

  const profile = await db.profile.findUnique({ where: { email } });
  if (!profile) {
    console.error(`No profile found for ${email}. Sign in with Google first.`);
    process.exit(1);
  }

  await db.profile.update({ where: { email }, data: { role: "ADMIN" } });
  console.log(`${email} is now an ADMIN.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
