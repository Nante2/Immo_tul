import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db from './db.js';

async function main() {
  console.log('Debut du seed de la base de donnees...');

  try {
    // Garde-fou : le seed efface tous les biens existants
    const force = process.argv.includes('--force');
    const { rows: countRows } = await db.query('SELECT COUNT(*) FROM properties');
    const existing = parseInt(countRows[0].count);
    if (existing > 0 && !force) {
      console.error(`Arret : la base contient deja ${existing} bien(s), que le seed supprimerait.`);
      console.error('Pour remplacer quand meme toutes les annonces : npm run db:seed -- --force');
      process.exit(1);
    }
    if (process.env.NODE_ENV === 'production' && !force) {
      console.error("Arret : seed refuse en production (ajoutez --force si c'est vraiment voulu).");
      process.exit(1);
    }

    // 1. Creer l'administrateur
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
    
    await db.query(
      `INSERT INTO users (email, password, name, role) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (email) DO NOTHING`,
      [process.env.ADMIN_EMAIL || 'admin@immotulear.mg', hashedPassword, 'Admin ImmoTulear', process.env.ADMIN_ROLE || 'admin']
    );
    console.log(`Admin cree/verifie : ${process.env.ADMIN_EMAIL || 'admin@immotulear.mg'} (mot de passe : ADMIN_PASSWORD du fichier .env)`);

    // 2. Nettoyer les proprietes existantes (optionnel, selon le comportement voulu)
    await db.query('DELETE FROM properties');

    // 3. Proprietes issues du frontend
    const propertiesData = [
      {
        titre: 'Villa Moderne Andranomena',
        description: "Magnifique villa moderne avec jardin paysager, cuisine equipee et terrasse panoramique. Parfaite pour une famille souhaitant allier confort et modernite.",
        prix: '850 000 000 Ar', priceNumeric: 850000000,
        type: 'Maison', location: 'Andranomena, Toliara',
        beds: 3, baths: 2, area: '120m2',
        status: 'available', actionType: 'sale',
        image: 'image/Maison.jpg',
        images: JSON.stringify(["image/Maison.jpg", "image/Vclaire.jpg", "image/Vclaire2.jpg"]),
        features: JSON.stringify(["Cuisine equipee moderne", "Jardin paysager", "Terrasse panoramique", "Garage couvert", "Systeme de securite", "Climatisation"]),
        details: JSON.stringify({ surface_terrain: "300m2", annee_construction: "2020", etages: "1", orientation: "Sud-Est", chauffage: "Climatisation", parking: "2 places" })
      },
      {
        titre: 'Appartement Centre-Ville',
        description: "Bel appartement meuble au coeur de la ville. Proche de tous commerces et services.",
        prix: '350 000 Ar/mois', priceNumeric: 350000,
        type: 'Appartement', location: 'Centre-ville, Toliara',
        beds: 2, baths: 1, area: '80m2',
        status: 'available', actionType: 'rent',
        image: 'image/Alouer.jpg',
        images: JSON.stringify(["image/Alouer.jpg", "image/Alouer2.jpg", "image/Alouer3.jpg"]),
        features: JSON.stringify(["Entierement meuble", "Centre-ville", "Proche commerces", "Balcon", "Internet inclus", "Securise"]),
        details: JSON.stringify({ etage: "2eme etage", ascenseur: "Non", meuble: "Oui", charges: "50 000 Ar/mois", caution: "2 mois de loyer", disponibilite: "Immediate" })
      }
    ];

    for (const p of propertiesData) {
      await db.query(
        `INSERT INTO properties 
         (titre, description, prix, price_numeric, type, location, beds, baths, area, status, action_type, image, images, features, details) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [p.titre, p.description, p.prix, p.priceNumeric, p.type, p.location, p.beds, p.baths, p.area, p.status, p.actionType, p.image, p.images, p.features, p.details]
      );
    }
    console.log(`${propertiesData.length} proprietes creees`);

    // 4. Contacts d'exemple
    await db.query('DELETE FROM contacts');
    
    await db.query(
      `INSERT INTO contacts (name, email, subject, message, status) VALUES 
       ($1, $2, $3, $4, $5),
       ($6, $7, $8, $9, $10)`,
      [
        'Jean Dupont', 'jean@example.com', 'Demande visite', 'Je suis interesse par la villa Andranomena.', 'new',
        'Marie Rakoto', 'marie@example.com', 'Information terrain', 'Le terrain Ankiembe est-il negociable ?', 'read'
      ]
    );
    console.log('Contacts de test crees');

    console.log('Seed termine avec succes !');
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
