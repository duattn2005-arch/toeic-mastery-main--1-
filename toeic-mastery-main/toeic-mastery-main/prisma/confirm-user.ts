/**
 * Local-dev convenience: manually marks a Supabase auth user's email as
 * confirmed, bypassing the "click the link we emailed you" step. Supabase's
 * default "Confirm email" setting means signUp() succeeds without an active
 * session until that link is clicked — useful in production, annoying when
 * testing locally without checking an inbox.
 *
 * Usage: npm run db:confirm-user -- someone@example.com
 *
 * To skip this step going forward, disable "Confirm email" in the Supabase
 * dashboard under Authentication > Providers > Email (dev/staging projects
 * only — keep it enabled in production).
 */
import "dotenv/config";
import { Client } from "pg";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npm run db:confirm-user -- someone@example.com");
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();

  const result = await client.query(
    `update auth.users set email_confirmed_at = now()
     where email = $1 and email_confirmed_at is null
     returning id, email`,
    [email]
  );

  if (result.rowCount === 0) {
    console.log(`No unconfirmed user found for ${email} (already confirmed, or doesn't exist).`);
  } else {
    console.log(`Confirmed: ${result.rows[0].email} (${result.rows[0].id})`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
