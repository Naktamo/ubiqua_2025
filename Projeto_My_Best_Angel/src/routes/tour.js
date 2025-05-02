const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');

// Rotas públicas para tours
router.get('/details/:id', tourController.showPublicTour);
router.get('/search', tourController.searchTours);

module.exports = router;