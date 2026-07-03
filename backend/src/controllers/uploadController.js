const fs = require('fs');
const multer = require('multer');
const path = require('path');
const pool = require('../config/db');
const env = require('../config/env');

const uploadPath = path.resolve(process.cwd(), env.uploadDir);
fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.jpg';
    cb(null, `${req.params.fotoId}${ext}`);
  },
});

const upload = multer({ storage });

async function savePhotoFile(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Arquivo nao enviado' });
    }

    const remoteUrl = `${env.appUrl}/uploads/${req.file.filename}`;

    const [result] = await pool.execute(
      `UPDATE foto_registro
       SET remote_url = :remoteUrl,
           caminho = :remoteUrl,
           nome_arquivo = :nomeArquivo,
           mime_type = :mimeType,
           updated_at = NOW(3),
           deleted_at = NULL
       WHERE id = :fotoId
         AND registro_id = :registroId
         AND empresa_id = :empresaId`,
      {
        remoteUrl,
        nomeArquivo: req.file.originalname || req.file.filename,
        mimeType: req.file.mimetype || '',
        fotoId: req.params.fotoId,
        registroId: req.params.registroId,
        empresaId: req.user.empresaId,
      },
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Foto nao encontrada para esta empresa' });
    }

    return res.json({ remote_url: remoteUrl });
  } catch (error) {
    return next(error);
  }
}

module.exports = { savePhotoFile, upload };
