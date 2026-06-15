const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate } = require('../middleware/auth');

router.get('/public', settingsController.getPublicSettings);
router.get('/whatsapp', settingsController.getWhatsAppSupport);
router.get('/whatsapp/me', authenticate, settingsController.getWhatsAppForUser);

module.exports = router;
