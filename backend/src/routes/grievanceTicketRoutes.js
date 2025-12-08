const express = require('express');
const router = express.Router();
const grievanceTicketController = require('../controllers/grievanceTicketController');
const { authenticate } = require('../middleware/auth');

// Public routes - no authentication required
// Track ticket by Ticket ID
router.get('/track/:ticketId', grievanceTicketController.trackByTicketId);

// All other routes require authentication
router.use(authenticate);

// Create new ticket (victims)
router.post('/create', grievanceTicketController.createTicket);

// Get my tickets (victim's own tickets)
router.get('/my-tickets', grievanceTicketController.getMyTickets);

// Get all tickets (officers/admin only)
router.get('/', grievanceTicketController.getAllTickets);

// Get single ticket by ID
router.get('/:id', grievanceTicketController.getTicketById);

// Respond to ticket (officers only)
router.post('/:id/respond', grievanceTicketController.respondToTicket);

// Update ticket status (officers only)
router.patch('/:id/status', grievanceTicketController.updateTicketStatus);

module.exports = router;
