import 'dotenv/config';
import { pool } from './db.js';

const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        titre VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        prix VARCHAR(255) NOT NULL,
        price_numeric DOUBLE PRECISION NOT NULL,
        type VARCHAR(100) NOT NULL,
        location VARCHAR(255) NOT NULL,
        beds INTEGER,
        baths INTEGER,
        area VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'available',
        action_type VARCHAR(50) NOT NULL,
        features TEXT DEFAULT '[]',
        details TEXT DEFAULT '{}',
        images TEXT DEFAULT '[]',
        image VARCHAR(500) DEFAULT '',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'new',
        property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS stats (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
        views INTEGER DEFAULT 0,
        inquiries INTEGER DEFAULT 0,
        date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_properties_action_type ON properties(action_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_contacts_property_id ON contacts(property_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_stats_property_id ON stats(property_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_stats_date ON stats(date)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);

    // Create updated_at trigger function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Create triggers for auto-updating updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
      CREATE TRIGGER update_properties_updated_at
        BEFORE UPDATE ON properties
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query('COMMIT');
    console.log(' Schéma de base de données initialisé avec succès');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(' Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

initDB();
