const { Router } = require('express');
const auth = require('../middlewares/auth');
const authController = require('../controllers/authController');
const syncController = require('../controllers/syncController');
const uploadController = require('../controllers/uploadController');

const routes = Router();

routes.post('/auth/login', authController.login);
routes.get('/auth/me', auth, authController.me);

routes.get('/sync', auth, syncController.pull);
routes.post('/sync', auth, syncController.push);

routes.post(
  '/registros/:registroId/fotos/:fotoId/file',
  auth,
  uploadController.upload.single('file'),
  uploadController.savePhotoFile,
);

module.exports = routes;
