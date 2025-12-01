import 'dotenv/config.js';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL);
const db = drizzle({ client: sql }); // Initialize Drizzle ORM with Neon client

export { db, sql };
