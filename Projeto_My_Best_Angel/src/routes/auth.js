const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isNotAuthenticated } = require('../middleware/auth');

// Rotas de autenticação
router.get('/login', isNotAuthenticated, authController.showLoginPage);
router.get('/register', isNotAuthenticated, authController.showRegisterPage);
router.post('/login', isNotAuthenticated, authController.login);
router.post('/register/angel', isNotAuthenticated, authController.registerAngel);
router.post('/register/visitor', isNotAuthenticated, authController.registerVisitor);
router.get('/logout', authController.logout);

module.exports = router;