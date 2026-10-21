import db from '../db.js';
import { sendMail, agencyRecipients } from '../services/mailer.js';
import { newContactEmail, contactAcknowledgementEmail } from '../services/emailTemplates.js';

// Prévient l'agence et confirme la réception au visiteur. Les erreurs sont journalisées
// par le service d'envoi : elles n'affectent jamais l'enregistrement du message.
const sendContactEmails = async (contact) => {
  let property = null;
  if (contact.propertyId) {
    const { rows } = await db.query('SELECT id, titre FROM properties WHERE id = $1', [contact.propertyId]);
    property = rows[0] || null;
  }
  const recipients = agencyRecipients();
  const sends = [sendMail({ to: contact.email, ...contactAcknowledgementEmail(contact, property) })];
  if (recipients.length > 0) {
    sends.push(sendMail({ to: recipients, ...newContactEmail(contact, property) }));
  } else {
    console.warn("⚠️  MAIL_TO vide : aucune notification envoyée à l'agence");
  }
  await Promise.allSettled(sends);
};

// Helper: map contact row from snake_case to camelCase
const mapContact = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    status: row.status,
    propertyId: row.property_id,
    createdAt: row.created_at,
  };
};

// POST /api/contacts — Envoyer un message (public)
export const create = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message, propertyId } = req.body;
    const { rows } = await db.query(
      `INSERT INTO contacts (name, email, phone, subject, message, property_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email, phone || null, subject, message, propertyId ? parseInt(propertyId) : null]
    );

    const contact = mapContact(rows[0]);

    // Incrémenter le compteur de demandes si lié à une propriété
    if (propertyId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      try {
        await db.query(
          `INSERT INTO stats (property_id, inquiries, date) VALUES ($1, 1, $2)`,
          [parseInt(propertyId), today]
        );
      } catch {
        // Silently ignore stats errors
      }
    }

    // Envoi en arrière-plan : le visiteur n'attend pas le serveur SMTP
    sendContactEmails(contact).catch((err) => console.error('Erreur lors des emails de contact :', err.message));

    res.status(201).json(contact);
  } catch (error) {
    next(error);
  }
};

// GET /api/contacts — Liste des messages (authentifié)
export const getAll = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    let whereClause = '';
    const params = [];
    const countParams = [];

    if (status) {
      params.push(status);
      countParams.push(status);
      whereClause = `WHERE c.status = $1`;
    }

    const countWhere = status ? 'WHERE status = $1' : '';

    params.push(limitNum);
    params.push(offset);

    const [contactsResult, countResult] = await Promise.all([
      db.query(
        `SELECT c.*, p.id AS prop_id, p.titre AS prop_titre, p.type AS prop_type
         FROM contacts c
         LEFT JOIN properties p ON c.property_id = p.id
         ${whereClause}
         ORDER BY c.created_at DESC
         LIMIT $${params.length - 1} OFFSET $${params.length}`,
        params
      ),
      db.query(`SELECT COUNT(*) FROM contacts ${countWhere}`, countParams),
    ]);

    const contacts = contactsResult.rows.map(row => {
      const contact = mapContact(row);
      contact.property = row.property_id
        ? { id: row.prop_id, titre: row.prop_titre, type: row.prop_type }
        : null;
      return contact;
    });

    const total = parseInt(countResult.rows[0].count);

    res.json({
      contacts,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/contacts/:id — Détail d'un message (marque comme lu)
export const getById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    // Update status to 'read' and return with property join
    const { rows } = await db.query(
      `UPDATE contacts SET status = 'read' WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    const contact = mapContact(rows[0]);

    // Fetch related property if any
    if (contact.propertyId) {
      const propResult = await db.query('SELECT * FROM properties WHERE id = $1', [contact.propertyId]);
      contact.property = propResult.rows[0] || null;
    } else {
      contact.property = null;
    }

    res.json(contact);
  } catch (error) {
    next(error);
  }
};

// PUT /api/contacts/:id/status — Changer le statut
export const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ error: 'Statut invalide (new, read, replied)' });
    }

    const { rows } = await db.query(
      `UPDATE contacts SET status = $1 WHERE id = $2 RETURNING *`,
      [status, parseInt(req.params.id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    res.json(mapContact(rows[0]));
  } catch (error) {
    next(error);
  }
};

// DELETE /api/contacts/:id — Supprimer un message (admin)
export const remove = async (req, res, next) => {
  try {
    const { rowCount } = await db.query('DELETE FROM contacts WHERE id = $1', [parseInt(req.params.id)]);

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Contact non trouvé' });
    }

    res.json({ message: 'Message supprimé' });
  } catch (error) {
    next(error);
  }
};
