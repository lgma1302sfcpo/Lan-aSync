require('dotenv').config();

const env = {
  port: Number(process.env.PORT || 3333),
  appUrl: process.env.APP_URL || 'http://localhost:3333',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'teste_candidato_offline',
  },
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
};

module.exports = env;
