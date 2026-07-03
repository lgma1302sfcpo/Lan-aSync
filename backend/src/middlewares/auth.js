const jwt = require('jsonwebtoken');
const env = require('../config/env');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [, token] = header.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'Token nao informado' });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = {
      id: payload.sub,
      empresaId: payload.empresaId,
      login: payload.login,
    };
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'Token invalido' });
  }
}

module.exports = auth;
