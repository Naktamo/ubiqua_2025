const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const { isAuthenticated, isVisitor, checkVisitorPermission } = require('../middleware/auth');

// Middleware para verificar autenticação e tipo de usuário
router.use(isAuthenticated);
router.use(isVisitor);

// Rotas para Visitors (turistas)
router.get('/dashboard', visitorController.dashboard);
router.get('/profile', visitorController.showProfile);
router.get('/edit-profile', visitorController.showEditProfileForm);
router.post('/update-profile', visitorController.updateProfile);

// Rotas de tours
router.get('/available-tours', visitorController.showAvailableTours);
router.get('/tour/:id', visitorController.showTour);
router.post('/book-tour/:id', visitorController.bookTour);
router.post('/cancel-booking/:id', visitorController.cancelBooking);
router.post('/rate-tour/:id', visitorController.rateTour);

// Rotas de mensagens
router.get('/messages', visitorController.showMessages);
router.post('/send-message', visitorController.sendMessage);

module.exports = router;