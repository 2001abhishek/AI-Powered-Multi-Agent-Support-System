import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const migrationClient = postgres(process.env.DATABASE_URL!, { max: 1 });

async function main() {
    console.log('Migrating database...');
    await migrate(drizzle(migrationClient), { migrationsFolder: "drizzle" });
    console.log('Migration complete!');
    await migrationClient.end();
}

main().catch((err) => {
    console.error('Migration failed!', err);
    process.exit(1);
});
