import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test connection on startup
pool.query('SELECT NOW()')
  .then(() => console.log('PostgreSQL connecté'))
  .catch((err) => console.error(' Erreur de connexion PostgreSQL:', err.message));

export const query = (text, params) => pool.query(text, params);
export { pool };
export default { query, pool };
