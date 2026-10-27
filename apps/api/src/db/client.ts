import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

// Explicit opt-in: Mock routes never import or connect to this database client.
export function createDatabase(url: string) {
  if (!url) throw new Error('DATABASE_URL is required for PostgreSQL persistence.');
  return drizzle(url, { schema });
}
