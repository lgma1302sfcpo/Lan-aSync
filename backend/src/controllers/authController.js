const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const env = require('../config/env');

function mapUser(row) {
  return {
    id: String(row.id),
    nome: row.nome,
    login: row.login,
    empresa_id: String(row.empresa_id),
    empresa: {
      id: String(row.empresa_id),
      nome: row.empresa_nome,
    },
  };
}

async function login(req, res, next) {
  try {
    const { login: loginInput, senha } = req.body;

    if (!loginInput || !senha) {
      return res.status(400).json({ message: 'Login e senha sao obrigatorios' });
    }

    const [rows] = await pool.execute(
      `SELECT u.id, u.nome, u.login, u.senha_hash, u.empresa_id, e.nome AS empresa_nome
       FROM usuario u
       INNER JOIN empresa e ON e.id = u.empresa_id
       WHERE u.login = :login
       LIMIT 1`,
      { login: loginInput },
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Credenciais invalidas' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ message: 'Credenciais invalidas' });
    }

    const token = jwt.sign(
      { empresaId: String(user.empresa_id), login: user.login },
      env.jwtSecret,
      { subject: String(user.id), expiresIn: '7d' },
    );

    return res.json({
      token,
      usuario: mapUser(user),
      timestamp: Date.now(),
    });
  } catch (error) {
    return next(error);
  }
}

async function me(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.nome, u.login, u.empresa_id, e.nome AS empresa_nome
       FROM usuario u
       INNER JOIN empresa e ON e.id = u.empresa_id
       WHERE u.id = :id
       LIMIT 1`,
      { id: req.user.id },
    );

    if (!rows[0]) {
      return res.status(404).json({ message: 'Usuario nao encontrado' });
    }

    return res.json({ usuario: mapUser(rows[0]) });
  } catch (error) {
    return next(error);
  }
}

module.exports = { login, me };
