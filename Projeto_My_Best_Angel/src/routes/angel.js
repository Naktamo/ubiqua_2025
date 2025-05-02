const express = require('express');
const router = express.Router();
const angelController = require('../controllers/angelController');
const { isAuthenticated, isAngel, checkAngelPermission } = require('../middleware/auth');

// Middleware para verificar autenticação e tipo de usuário
router.use(isAuthenticated);
router.use(isAngel);

// Rotas para Angels (guias turísticos)
router.get('/dashboard', angelController.dashboard);
router.get('/profile', angelController.showProfile);
router.get('/edit-profile', angelController.showEditProfileForm);
router.post('/update-profile', angelController.updateProfile);

// Rotas de tours
router.get('/create-tour', angelController.showCreateTourForm);
router.post('/create-tour', angelController.createTour);
router.get('/tours', angelController.showTours);
router.get('/tour/:id', angelController.showTour);
router.get('/edit-tour/:id', angelController.showEditTourForm);
router.post('/update-tour/:id', angelController.updateTour);
router.post('/cancel-tour/:id', angelController.cancelTour);

// Rotas de visitantes
router.get('/visitors', angelController.showVisitors);

// Rotas de mensagens
router.get('/messages', angelController.showMessages);
router.post('/send-message', angelController.sendMessage);

// Rota de insights
router.get('/insights', angelController.showInsights);

module.exports = router;