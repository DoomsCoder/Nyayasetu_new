const express = require('express');
const router = express.Router();
const grievanceController = require('../controllers/grievanceController');
const { authenticate } = require('../middleware/auth');

// Public routes - no authentication required
router.get('/track/:caseId', grievanceController.trackByCaseId);

// Victim-accessible routes (can be used without login from Track Status page)
router.patch('/:id/queries/:index/respond', grievanceController.respondToQuery);
router.patch('/:id/disbursements/:index/verify', grievanceController.verifyTransaction);

// All other routes require authentication
router.use(authenticate);

// Create new grievance (victims)
router.post('/create', grievanceController.createGrievance);

// Get my grievances (victim's own grievances)
router.get('/my-grievances', grievanceController.getMyGrievances);

// Get single grievance by ID
router.get('/:id', grievanceController.getGrievanceById);

// Get all grievances (officers/admin only)
router.get('/', grievanceController.getGrievances);

// Update grievance (officers/admin only)
router.put('/:id', grievanceController.updateGrievance);

// Update status only (officers/admin only)
router.patch('/:id/status', grievanceController.updateStatus);

// Query routes (officer only)
router.post('/:id/queries', grievanceController.addQuery);
router.patch('/:id/queries/:index/resolve', grievanceController.resolveQuery);

// Disbursement routes (officer only)
router.post('/:id/disbursements', grievanceController.saveDisbursements);

module.exports = router;
