const express = require('express');
const router = express.Router();
const packageController = require('../controllers/packageController');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

// Get all available packages
router.get('/', packageController.getAllPackages);

// Get user's packages (authenticated) - MUST come before /:id route
router.get('/my/packages', authenticate, packageController.getMyPackages);

// Get single package
router.get('/:id', packageController.getPackage);

// Purchase package (authenticated)
router.post('/:id/purchase',
  authenticate,
  handleValidationErrors,
  packageController.purchasePackage
);

module.exports = router;

