const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

// Get chat messages
router.get('/messages', authenticate, chatController.getMessages);

// Send message
router.post('/messages',
  authenticate,
  [
    body('message').trim().notEmpty().isLength({ min: 1, max: 1000 })
  ],
  handleValidationErrors,
  chatController.sendMessage
);

// Report message
router.post('/messages/:id/report',
  authenticate,
  handleValidationErrors,
  chatController.reportMessage
);

module.exports = router;

