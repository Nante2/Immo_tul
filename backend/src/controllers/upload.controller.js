import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// POST /api/upload
export const uploadFiles = (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier uploadé' });
    }

    const filePaths = req.files.map(file => {
      // Return relative path for DB storage (e.g., "uploads/163456789-image.jpg")
      return `${process.env.UPLOAD_DIR || 'uploads'}/${file.filename}`;
    });

    res.status(201).json({
      message: `${filePaths.length} fichier(s) uploadé(s) avec succès`,
      files: filePaths
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
};

// DELETE /api/upload/:filename
export const deleteFile = (req, res) => {
  try {
    const filename = req.params.filename;
    // Prevent directory traversal attacks
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ error: 'Nom de fichier invalide' });
    }

    const filePath = path.join(UPLOAD_DIR, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'Fichier supprimé avec succès' });
    } else {
      res.status(404).json({ error: 'Fichier non trouvé' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du fichier' });
  }
};
