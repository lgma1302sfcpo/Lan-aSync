require('dotenv').config();

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const env = require('../src/config/env');

async function main() {
  const root = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true,
  });

  await root.query(`CREATE DATABASE IF NOT EXISTS \`${env.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await root.end();

  const db = await mysql.createConnection({
    ...env.db,
    multipleStatements: true,
  });

  await db.query(`
    CREATE TABLE IF NOT EXISTS empresa (
      id INT PRIMARY KEY AUTO_INCREMENT,
      nome VARCHAR(120) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      deleted_at DATETIME(3) NULL
    );

    CREATE TABLE IF NOT EXISTS usuario (
      id INT PRIMARY KEY AUTO_INCREMENT,
      nome VARCHAR(120) NOT NULL,
      login VARCHAR(120) NOT NULL UNIQUE,
      senha_hash VARCHAR(255) NOT NULL,
      empresa_id INT NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      deleted_at DATETIME(3) NULL,
      CONSTRAINT fk_usuario_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id)
    );

    CREATE TABLE IF NOT EXISTS registro (
      id VARCHAR(36) PRIMARY KEY,
      empresa_id INT NOT NULL,
      usuario_id INT NOT NULL,
      tipo ENUM('COMPRA', 'VENDA') NOT NULL,
      data_hora DATETIME(3) NOT NULL,
      descricao TEXT NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      deleted_at DATETIME(3) NULL,
      CONSTRAINT fk_registro_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
      CONSTRAINT fk_registro_usuario FOREIGN KEY (usuario_id) REFERENCES usuario(id),
      INDEX idx_registro_empresa_updated (empresa_id, updated_at)
    );

    CREATE TABLE IF NOT EXISTS foto_registro (
      id VARCHAR(36) PRIMARY KEY,
      registro_id VARCHAR(36) NOT NULL,
      empresa_id INT NOT NULL,
      local_uri TEXT NULL,
      remote_url TEXT NULL,
      caminho TEXT NULL,
      nome_arquivo VARCHAR(255) NULL,
      mime_type VARCHAR(120) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      deleted_at DATETIME(3) NULL,
      CONSTRAINT fk_foto_registro FOREIGN KEY (registro_id) REFERENCES registro(id),
      CONSTRAINT fk_foto_empresa FOREIGN KEY (empresa_id) REFERENCES empresa(id),
      INDEX idx_foto_empresa_updated (empresa_id, updated_at)
    );
  `);

  await db.execute(
    `INSERT INTO empresa (id, nome)
     VALUES (1, 'Empresa Alfa'), (2, 'Empresa Beta')
     ON DUPLICATE KEY UPDATE nome = VALUES(nome), updated_at = NOW(3), deleted_at = NULL`,
  );

  const senhaHash = await bcrypt.hash('123456', 10);

  await db.execute(
    `INSERT INTO usuario (id, nome, login, senha_hash, empresa_id)
     VALUES
       (1, 'Joao Empresa Alfa', 'joao@empresa1.com', ?, 1),
       (2, 'Maria Empresa Beta', 'maria@empresa2.com', ?, 2)
     ON DUPLICATE KEY UPDATE
       nome = VALUES(nome),
       login = VALUES(login),
       senha_hash = VALUES(senha_hash),
       empresa_id = VALUES(empresa_id),
       updated_at = NOW(3),
       deleted_at = NULL`,
    [senhaHash, senhaHash],
  );

  await db.end();

  console.log('Banco inicializado.');
  console.log('Usuarios de teste:');
  console.log('- joao@empresa1.com / 123456');
  console.log('- maria@empresa2.com / 123456');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
