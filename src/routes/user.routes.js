const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth.middleware');
const isAdmin = require('../middlewares/isAdmin.middleware');
const ctrl = require('../controllers/user.controller');

// Perfil y ajustes del usuario autenticado
router.get('/me', auth, ctrl.getMe);
router.put('/me', auth, ctrl.updateMe);
router.put('/me/password', auth, ctrl.changeMyPassword);

// Admin
router.get('/', auth, isAdmin, ctrl.listUsers);
router.get('/:id', auth, isAdmin, ctrl.getUserById);
router.put('/:id', auth, isAdmin, ctrl.updateUserById);
router.delete('/:id', auth, isAdmin, ctrl.deleteUserById);

module.exports = router;
