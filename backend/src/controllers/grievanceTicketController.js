const GrievanceTicket = require('../models/GrievanceTicket');
const Grievance = require('../models/Grievance');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

/**
 * Create a new grievance ticket (complaint)
 * POST /api/tickets/create
 * Requires authentication
 */
const createTicket = async (req, res) => {
    try {
        const { caseId, category, subject, description, attachment } = req.body;

        // Validate required fields
        if (!caseId || !category || !subject || !description) {
            return res.status(400).json({
                success: false,
                message: 'Case ID, category, subject, and description are required'
            });
        }

        // Verify the case ID exists in the system
        const existingCase = await Grievance.findOne({ caseId: caseId.trim() });
        if (!existingCase) {
            return res.status(404).json({
                success: false,
                message: 'Invalid Case ID. No relief case found with this ID.'
            });
        }

        // Create the ticket
        const ticket = new GrievanceTicket({
            caseId: caseId.trim(),
            userId: req.user.userId,
            category,
            subject: subject.trim(),
            description: description.trim(),
            attachment
        });

        await ticket.save();
        console.log(`✅ Ticket created successfully: ${ticket.ticketId}`);

        // Send email notification to the user who submitted the ticket
        // First, fetch the user's email from the database
        const submittingUser = await User.findById(req.user.userId);
        const userEmail = submittingUser?.email || existingCase.email;
        console.log(`📧 User email: ${submittingUser?.email || 'NOT FOUND'}, Case email: ${existingCase.email || 'NOT FOUND'}`);

        if (userEmail) {
            const categoryLabels = {
                delay: 'Delay in Processing',
                verification: 'Verification Issues',
                disbursement: 'Disbursement Problems',
                technical: 'Technical Support',
                document: 'Document Related',
                other: 'Other'
            };

            const emailContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f5f5f5; padding: 20px;">
                    <div style="background-color: #1a237e; color: white; padding: 20px; text-align: center;">
                        <h1 style="margin: 0;">NyayaSetu</h1>
                        <p style="margin: 5px 0 0 0;">Justice with Dignity</p>
                    </div>
                    
                    <div style="background-color: white; padding: 30px;">
                        <h2 style="color: #1a237e;">Grievance Ticket Submitted Successfully</h2>
                        
                        <p>Dear Applicant,</p>
                        
                        <p>Your grievance/complaint has been successfully registered. Please save the ticket ID for future reference.</p>
                        
                        <div style="background-color: #e8eaf6; padding: 20px; border-left: 4px solid #1a237e; margin: 20px 0;">
                            <h3 style="margin: 0 0 15px 0; color: #1a237e;">Ticket Details</h3>
                            <p style="margin: 5px 0;"><strong>Ticket ID:</strong> <span style="color: #1a237e; font-size: 18px;">${ticket.ticketId}</span></p>
                            <p style="margin: 5px 0;"><strong>Related Case ID:</strong> ${ticket.caseId}</p>
                            <p style="margin: 5px 0;"><strong>Category:</strong> ${categoryLabels[ticket.category] || ticket.category}</p>
                            <p style="margin: 5px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
                            <p style="margin: 5px 0;"><strong>Status:</strong> Open</p>
                            <p style="margin: 5px 0;"><strong>Submitted On:</strong> ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                        
                        <p><strong>Track Your Ticket:</strong> You can track the status of your grievance at any time by visiting our portal and entering your Ticket ID.</p>
                        
                        <p style="margin-top: 30px;">For any queries, please contact us at support@nyayasetu.gov.in</p>
                        
                        <p>Best Regards,<br>NyayaSetu Team</p>
                    </div>
                    
                    <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
                        <p>This is an automated message. Please do not reply to this email.</p>
                    </div>
                </div>
            `;

            // Send email in background without blocking response
            console.log('📤 Sending email now...');
            sendEmail({
                to: userEmail,
                subject: `Grievance Ticket Submitted - ${ticket.ticketId}`,
                html: emailContent
            }).then(() => {
                console.log(`✅ Ticket confirmation email sent to ${userEmail}`);
            }).catch((emailError) => {
                console.error('❌ Failed to send ticket confirmation email:', emailError.message);
            });
        } else {
            console.log('⚠️ No email found in case record, skipping email notification');
        }

        res.status(201).json({
            success: true,
            message: 'Grievance ticket submitted successfully',
            data: {
                ticketId: ticket.ticketId,
                caseId: ticket.caseId,
                category: ticket.category,
                subject: ticket.subject,
                status: ticket.status,
                createdAt: ticket.createdAt
            }
        });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create ticket',
            error: error.message
        });
    }
};

/**
 * Get my tickets (victim's own tickets)
 * GET /api/tickets/my-tickets
 * Requires authentication
 */
const getMyTickets = async (req, res) => {
    try {
        const tickets = await GrievanceTicket.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .populate('responses.respondedBy', 'name');

        res.json({
            success: true,
            data: tickets
        });
    } catch (error) {
        console.error('Get my tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets',
            error: error.message
        });
    }
};

/**
 * Get all tickets (officers only)
 * GET /api/tickets
 * Requires authentication + officer role
 */
const getAllTickets = async (req, res) => {
    try {
        // Check if user is officer
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const { status, category, caseId } = req.query;

        // Build filter
        const filter = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (caseId) filter.caseId = { $regex: caseId, $options: 'i' };

        const tickets = await GrievanceTicket.find(filter)
            .sort({ createdAt: -1 })
            .populate('userId', 'name email')
            .populate('responses.respondedBy', 'name')
            .populate('assignedOfficer', 'name');

        res.json({
            success: true,
            count: tickets.length,
            data: tickets
        });
    } catch (error) {
        console.error('Get all tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets',
            error: error.message
        });
    }
};

/**
 * Get single ticket by ID
 * GET /api/tickets/:id
 * Requires authentication
 */
const getTicketById = async (req, res) => {
    try {
        const ticket = await GrievanceTicket.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('responses.respondedBy', 'name')
            .populate('assignedOfficer', 'name');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Check access: owner or officer
        const isOwner = ticket.userId._id.toString() === req.user.userId;
        const isOfficer = req.user.role === 'officer' || req.user.role === 'admin';

        if (!isOwner && !isOfficer) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            data: ticket
        });
    } catch (error) {
        console.error('Get ticket by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ticket',
            error: error.message
        });
    }
};

/**
 * Track ticket by ticket ID (public - no auth required)
 * GET /api/tickets/track/:ticketId
 */
const trackByTicketId = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await GrievanceTicket.findOne({ ticketId: ticketId.toUpperCase() })
            .select('ticketId caseId category subject description status responses createdAt updatedAt resolvedAt')
            .populate('responses.respondedBy', 'name');

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'No ticket found with this ID. Please check your Ticket ID and try again.'
            });
        }

        res.json({
            success: true,
            data: ticket
        });
    } catch (error) {
        console.error('Track ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track ticket',
            error: error.message
        });
    }
};

/**
 * Respond to ticket (officers only)
 * POST /api/tickets/:id/respond
 */
const respondToTicket = async (req, res) => {
    try {
        // Check if user is officer
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Response message is required'
            });
        }

        const ticket = await GrievanceTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // Add response
        ticket.responses.push({
            message: message.trim(),
            respondedBy: req.user.userId,
            respondedAt: new Date()
        });

        // Update status to under_review if it was open
        if (ticket.status === 'open') {
            ticket.status = 'under_review';
        }

        // Assign officer if not already assigned
        if (!ticket.assignedOfficer) {
            ticket.assignedOfficer = req.user.userId;
        }

        await ticket.save();

        // Populate the response before sending
        await ticket.populate('responses.respondedBy', 'name');

        res.json({
            success: true,
            message: 'Response added successfully',
            data: ticket
        });
    } catch (error) {
        console.error('Respond to ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add response',
            error: error.message
        });
    }
};

/**
 * Update ticket status (officers only)
 * PATCH /api/tickets/:id/status
 */
const updateTicketStatus = async (req, res) => {
    try {
        // Check if user is officer
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Officers only.'
            });
        }

        const { status } = req.body;
        const validStatuses = ['open', 'under_review', 'resolved', 'closed'];

        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            });
        }

        const ticket = await GrievanceTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        ticket.status = status;

        // Set resolved date if status is resolved or closed
        if (status === 'resolved' || status === 'closed') {
            ticket.resolvedAt = new Date();
        } else {
            ticket.resolvedAt = null;
        }

        // Assign officer if not already assigned
        if (!ticket.assignedOfficer) {
            ticket.assignedOfficer = req.user.userId;
        }

        await ticket.save();

        res.json({
            success: true,
            message: `Ticket status updated to ${status}`,
            data: ticket
        });
    } catch (error) {
        console.error('Update ticket status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status',
            error: error.message
        });
    }
};

module.exports = {
    createTicket,
    getMyTickets,
    getAllTickets,
    getTicketById,
    trackByTicketId,
    respondToTicket,
    updateTicketStatus
};
