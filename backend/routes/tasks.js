const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { taskCompletionLimiter } = require('../middleware/rateLimiter');
const { handleValidationErrors } = require('../middleware/validation');
const { body } = require('express-validator');

// Get daily tasks (authenticated)
router.get('/daily', authenticate, taskController.getDailyTasks);

// Get task history (authenticated)
router.get('/history', authenticate, taskController.getTaskHistory);

// Get task completion history (authenticated)
router.get('/my/completions', authenticate, taskController.getMyCompletions);

// Get single task
router.get('/:id', optionalAuth, taskController.getTask);

// Complete task (authenticated)
router.post('/:id/complete',
  authenticate,
  taskCompletionLimiter,
  [
    body('userPackageId')
      .optional()
      .isUUID()
      .withMessage('Invalid package ID format')
  ],
  handleValidationErrors,
  taskController.completeTask
);

module.exports = router;

