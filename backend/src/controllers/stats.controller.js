import db from '../db.js';

// GET /api/stats/dashboard
export const dashboard = async (req, res, next) => {
  try {
    const [
      totalPropertiesResult,
      totalContactsResult,
      newContactsResult,
      propertiesByTypeResult,
      propertiesByActionResult,
      recentPropertiesResult,
      statsAggResult,
      timelineResult,
      topPropertiesResult,
    ] = await Promise.all([
      db.query('SELECT COUNT(*) FROM properties'),
      db.query('SELECT COUNT(*) FROM contacts'),
      db.query("SELECT COUNT(*) FROM contacts WHERE status = 'new'"),
      db.query('SELECT type, COUNT(*) AS count FROM properties GROUP BY type'),
      db.query('SELECT action_type, COUNT(*) AS count FROM properties GROUP BY action_type'),
      db.query(
        `SELECT id, titre, type, price_numeric AS "priceNumeric", action_type AS "actionType", status, created_at AS "createdAt"
         FROM properties ORDER BY created_at DESC LIMIT 5`
      ),
      db.query('SELECT COALESCE(SUM(views), 0) AS total_views, COALESCE(SUM(inquiries), 0) AS total_inquiries FROM stats'),
      // Vues des biens et messages reçus par jour sur les 30 derniers jours (jours sans activité inclus).
      // Les demandes viennent de la table contacts : tous les messages, liés à un bien ou non.
      db.query(
        `SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
                COALESCE((SELECT SUM(s.views) FROM stats s WHERE s.date::date = d.day::date), 0) AS views,
                (SELECT COUNT(*) FROM contacts c WHERE c.created_at::date = d.day::date) AS inquiries
         FROM generate_series(CURRENT_DATE - 29, CURRENT_DATE, INTERVAL '1 day') AS d(day)
         ORDER BY d.day`
      ),
      // Biens les plus consultés
      db.query(
        `SELECT p.id, p.titre, p.type, p.action_type AS "actionType",
                SUM(s.views) AS views, SUM(s.inquiries) AS inquiries
         FROM stats s
         JOIN properties p ON p.id = s.property_id
         GROUP BY p.id
         ORDER BY views DESC, inquiries DESC
         LIMIT 5`
      ),
    ]);

    res.json({
      overview: {
        totalProperties: parseInt(totalPropertiesResult.rows[0].count),
        totalContacts: parseInt(totalContactsResult.rows[0].count),
        newContacts: parseInt(newContactsResult.rows[0].count),
        totalViews: parseInt(statsAggResult.rows[0].total_views),
        totalInquiries: parseInt(statsAggResult.rows[0].total_inquiries),
      },
      propertiesByType: propertiesByTypeResult.rows.map(r => ({
        type: r.type,
        _count: parseInt(r.count),
      })),
      propertiesByAction: propertiesByActionResult.rows.map(r => ({
        actionType: r.action_type,
        _count: parseInt(r.count),
      })),
      recentProperties: recentPropertiesResult.rows,
      timeline: timelineResult.rows.map(r => ({
        date: r.date,
        views: parseInt(r.views),
        inquiries: parseInt(r.inquiries),
      })),
      topProperties: topPropertiesResult.rows.map(r => ({
        ...r,
        views: parseInt(r.views),
        inquiries: parseInt(r.inquiries),
      })),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/stats/property/:id
export const propertyStats = async (req, res, next) => {
  try {
    const propertyId = parseInt(req.params.id);

    // Check if property exists
    const { rows: propRows } = await db.query(
      'SELECT id, titre FROM properties WHERE id = $1',
      [propertyId]
    );

    if (propRows.length === 0) {
      return res.status(404).json({ error: 'Propriété non trouvée' });
    }

    const { rows: statsRows } = await db.query(
      'SELECT * FROM stats WHERE property_id = $1 ORDER BY date ASC LIMIT 30',
      [propertyId]
    );

    const history = statsRows.map(s => ({
      id: s.id,
      propertyId: s.property_id,
      views: s.views,
      inquiries: s.inquiries,
      date: s.date,
    }));

    res.json({
      property: propRows[0],
      history,
      totals: history.reduce((acc, curr) => ({
        views: acc.views + curr.views,
        inquiries: acc.inquiries + curr.inquiries,
      }), { views: 0, inquiries: 0 }),
    });
  } catch (error) {
    next(error);
  }
};
