import db from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'agent' } = req.body;

    if (!['admin', 'agent'].includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide (admin ou agent)' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const { rows } = await db.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, role]
    );

    // Pas de token : le compte est créé par un admin déjà connecté
    res.status(201).json({ user: rows[0] });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, email, role, created_at AS "createdAt" FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/me
export const updateMe = async (req, res, next) => {
  try {
    const { name, email, password, currentPassword } = req.body;

    // Changer l'email ou le mot de passe exige le mot de passe actuel
    if (password || email) {
      const { rows: current } = await db.query('SELECT email, password FROM users WHERE id = $1', [req.user.id]);
      const sensitiveChange = password || (email && email !== current[0].email);
      if (sensitiveChange) {
        if (!currentPassword || !(await bcrypt.compare(currentPassword, current[0].password))) {
          return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
        }
      }
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      fields.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (email) {
      fields.push(`email = $${paramIndex++}`);
      values.push(email);
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Le mot de passe doit faire au moins 6 caractères' });
      }
      fields.push(`password = $${paramIndex++}`);
      values.push(await bcrypt.hash(password, 12));
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à modifier' });
    }

    values.push(req.user.id);
    const { rows } = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, name, email, role`,
      values
    );
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/users — Liste des comptes (admin)
export const listUsers = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT id, name, email, role, created_at AS "createdAt" FROM users ORDER BY created_at ASC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/auth/users/:id — Supprimer un compte (admin, pas soi-même)
export const deleteUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    const { rows: target } = await db.query('SELECT role FROM users WHERE id = $1', [id]);
    if (target.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }
    // Garde toujours au moins un administrateur
    if (target[0].role === 'admin') {
      const { rows } = await db.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
      if (parseInt(rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Impossible de supprimer le dernier administrateur' });
      }
    }
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    next(error);
  }
};
