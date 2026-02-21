import pg from 'pg'
const { Pool } = pg

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS links (
      id SERIAL PRIMARY KEY,
      short_code VARCHAR(10) UNIQUE NOT NULL,
      original_url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS clicks (
      id SERIAL PRIMARY KEY,
      link_id INTEGER REFERENCES links(id) ON DELETE CASCADE,
      clicked_at TIMESTAMPTZ DEFAULT NOW(),
      ip_hash VARCHAR(64),
      user_agent TEXT,
      referer TEXT
    );
  `)
  console.log('DB migrated')
}
