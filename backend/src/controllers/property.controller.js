import db from '../db.js';

// Parse une colonne JSON stockée en TEXT sans faire planter la requête si elle est corrompue
const parseJson = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

// Surface numérique extraite du texte libre pour le tri et le filtre : premier nombre
// après suppression des espaces ("1 200 m²" -> 1200, "80m2" -> 80, "12,5 ha" -> 12.5)
const AREA_NUMERIC = `substring(replace(regexp_replace(area, '[[:space:]]', '', 'g'), ',', '.') from '[0-9]+[.]?[0-9]*')::numeric`;

const MAX_LIMIT = 50;

// Helper: map property row from snake_case DB columns to camelCase API fields
const mapProperty = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    titre: row.titre,
    description: row.description,
    prix: row.prix,
    priceNumeric: row.price_numeric,
    type: row.type,
    location: row.location,
    beds: row.beds,
    baths: row.baths,
    area: row.area,
    status: row.status,
    actionType: row.action_type,
    features: parseJson(row.features, []),
    details: parseJson(row.details, {}),
    images: parseJson(row.images, []),
    image: row.image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// GET /api/properties — Liste publique avec filtres, tri et pagination
export const getAll = async (req, res, next) => {
  try {
    const { type, actionType, status, location, search, priceMin, priceMax, beds, area, sort, withStats, page = 1, limit = 12 } = req.query;

    const conditions = [];
    const params = [];

    if (type) {
      params.push(type);
      conditions.push(`type = $${params.length}`);
    }
    if (actionType) {
      params.push(actionType);
      conditions.push(`action_type = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (location) {
      params.push(`%${location}%`);
      conditions.push(`location ILIKE $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      const idx = params.length;
      conditions.push(`(titre ILIKE $${idx} OR location ILIKE $${idx} OR description ILIKE $${idx} OR type ILIKE $${idx})`);
    }
    if (beds) {
      params.push(parseInt(beds));
      conditions.push(`beds >= $${params.length}`);
    }
    if (priceMin) {
      params.push(parseFloat(priceMin));
      conditions.push(`price_numeric >= $${params.length}`);
    }
    if (priceMax) {
      params.push(parseFloat(priceMax));
      conditions.push(`price_numeric <= $${params.length}`);
    }
    if (area) {
      params.push(parseFloat(area));
      conditions.push(`${AREA_NUMERIC} >= $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Sort mapping
    let orderBy = 'created_at DESC';
    if (sort === 'price-asc') orderBy = 'price_numeric ASC';
    else if (sort === 'price-desc') orderBy = 'price_numeric DESC';
    else if (sort === 'area-desc') orderBy = `${AREA_NUMERIC} DESC NULLS LAST`;
    else if (sort === 'newest') orderBy = 'created_at DESC';

    const pageNum = Math.max(parseInt(page) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit) || 12, 1), MAX_LIMIT);
    const offset = (pageNum - 1) * limitNum;

    const countParams = [...params];
    params.push(limitNum);
    params.push(offset);

    // withStats=1 : ajoute le total des vues et demandes de chaque bien (tableau admin)
    const statsColumns = withStats
      ? `, (SELECT COALESCE(SUM(views), 0) FROM stats WHERE stats.property_id = properties.id) AS total_views,
           (SELECT COUNT(*) FROM contacts WHERE contacts.property_id = properties.id) AS total_contacts`
      : '';

    const [propertiesResult, countResult] = await Promise.all([
      db.query(
        `SELECT *${statsColumns} FROM properties ${whereClause}
         ORDER BY ${orderBy}
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
      db.query(
        `SELECT COUNT(*) FROM properties ${whereClause}`,
        countParams
      ),
    ]);

    const properties = propertiesResult.rows.map((row) => {
      const property = mapProperty(row);
      if (withStats) {
        property.views = parseInt(row.total_views);
        property.contacts = parseInt(row.total_contacts);
      }
      return property;
    });
    const total = parseInt(countResult.rows[0].count);

    res.json({
      properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/properties/stats — Compteurs publics
export const getStats = async (req, res, next) => {
  try {
    const [totalSaleResult, totalRentResult, byTypeResult, locationsResult] = await Promise.all([
      db.query("SELECT COUNT(*) FROM properties WHERE action_type = 'sale'"),
      db.query("SELECT COUNT(*) FROM properties WHERE action_type = 'rent'"),
      db.query('SELECT type, COUNT(*) AS count FROM properties GROUP BY type'),
      db.query('SELECT DISTINCT location FROM properties'),
    ]);
    // Quartiers distincts (partie avant la virgule : "Ankiembe, Toliara" -> "Ankiembe") pour les filtres
    const locations = [...new Set(
      locationsResult.rows.map(r => r.location.split(',')[0].trim()).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'fr'));
    res.json({
      totalSale: parseInt(totalSaleResult.rows[0].count),
      totalRent: parseInt(totalRentResult.rows[0].count),
      byType: byTypeResult.rows.map(r => ({ type: r.type, _count: parseInt(r.count) })),
      locations,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/properties/:id — Détail + incrément vues
export const getById = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM properties WHERE id = $1', [parseInt(req.params.id)]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Propriété non trouvée' });
    }

    const property = mapProperty(rows[0]);

    // Incrémenter les vues
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    try {
      await db.query(
        `INSERT INTO stats (property_id, views, date) VALUES ($1, 1, $2)`,
        [property.id, today]
      );
    } catch {
      // Silently ignore stats errors
    }

    res.json(property);
  } catch (error) {
    next(error);
  }
};

// GET /api/properties/:id/similar — Biens proches (même type, même transaction ou même zone)
export const getSimilar = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const limitNum = Math.min(Math.max(parseInt(req.query.limit) || 3, 1), 12);

    const { rows: refRows } = await db.query(
      'SELECT type, action_type, location, price_numeric FROM properties WHERE id = $1',
      [id]
    );
    if (refRows.length === 0) {
      return res.status(404).json({ error: 'Propriété non trouvée' });
    }
    const ref = refRows[0];

    // Score de proximité : même type et même transaction comptent le plus, puis la zone,
    // puis l'écart de prix pour départager
    const { rows } = await db.query(
      `SELECT *,
         (CASE WHEN type = $2 THEN 3 ELSE 0 END)
       + (CASE WHEN action_type = $3 THEN 2 ELSE 0 END)
       + (CASE WHEN location ILIKE $4 THEN 1 ELSE 0 END) AS score
       FROM properties
       WHERE id <> $1 AND status <> 'sold'
       ORDER BY score DESC, ABS(price_numeric - $5) ASC
       LIMIT $6`,
      [id, ref.type, ref.action_type, `%${ref.location}%`, ref.price_numeric, limitNum]
    );

    res.json(rows.map(mapProperty));
  } catch (error) {
    next(error);
  }
};

// POST /api/properties — Créer une propriété (authentifié)
export const create = async (req, res, next) => {
  try {
    const { titre, description, prix, priceNumeric, type, location, beds, baths, area, status, actionType, features, details, images, image } = req.body;

    const { rows } = await db.query(
      `INSERT INTO properties
       (titre, description, prix, price_numeric, type, location, beds, baths, area, status, action_type, features, details, images, image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        titre, description, prix, parseFloat(priceNumeric),
        type, location,
        beds ? parseInt(beds) : null,
        baths ? parseInt(baths) : null,
        area, status || 'available', actionType,
        JSON.stringify(features || []),
        JSON.stringify(details || {}),
        JSON.stringify(images || []),
        image || '',
      ]
    );

    res.status(201).json(mapProperty(rows[0]));
  } catch (error) {
    next(error);
  }
};

// PUT /api/properties/:id — Modifier une propriété (authentifié)
export const update = async (req, res, next) => {
  try {
    const { titre, description, prix, priceNumeric, type, location, beds, baths, area, status, actionType, features, details, images, image } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    const addField = (col, val) => {
      if (val !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(val);
      }
    };

    addField('titre', titre);
    addField('description', description);
    addField('prix', prix);
    if (priceNumeric !== undefined) { addField('price_numeric', parseFloat(priceNumeric)); }
    addField('type', type);
    addField('location', location);
    if (beds !== undefined) { addField('beds', beds ? parseInt(beds) : null); }
    if (baths !== undefined) { addField('baths', baths ? parseInt(baths) : null); }
    addField('area', area);
    addField('status', status);
    addField('action_type', actionType);
    if (features !== undefined) { addField('features', JSON.stringify(features)); }
    if (details !== undefined) { addField('details', JSON.stringify(details)); }
    if (images !== undefined) { addField('images', JSON.stringify(images)); }
    addField('image', image);

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à modifier' });
    }

    values.push(parseInt(req.params.id));
    const { rows } = await db.query(
      `UPDATE properties SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Propriété non trouvée' });
    }

    res.json(mapProperty(rows[0]));
  } catch (error) {
    next(error);
  }
};

// PATCH /api/properties/:id/status — Changer uniquement le statut (authentifié)
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['available', 'reserved', 'sold'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide (available, reserved, sold)' });
    }
    const { rows } = await db.query(
      'UPDATE properties SET status = $1 WHERE id = $2 RETURNING *',
      [status, parseInt(req.params.id)]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Propriété non trouvée' });
    }
    res.json(mapProperty(rows[0]));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/properties/:id — Supprimer (admin uniquement)
export const remove = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await db.query('DELETE FROM stats WHERE property_id = $1', [id]);
    const { rowCount } = await db.query('DELETE FROM properties WHERE id = $1', [id]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Propriété non trouvée' });
    }

    res.json({ message: 'Propriété supprimée' });
  } catch (error) {
    next(error);
  }
};
