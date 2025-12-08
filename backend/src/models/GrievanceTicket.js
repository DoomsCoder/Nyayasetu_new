const mongoose = require('mongoose');

// Counter for generating sequential ticket IDs
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 }
});
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const grievanceTicketSchema = new mongoose.Schema({
    // Auto-generated Ticket ID (format: GRV-2024-0001)
    ticketId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    // Reference to existing relief case - REQUIRED
    caseId: {
        type: String,
        required: [true, 'Case ID is required'],
        index: true
    },
    // User who submitted the ticket
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Category of complaint
    category: {
        type: String,
        enum: ['delay', 'verification', 'disbursement', 'technical', 'document', 'other'],
        required: [true, 'Category is required']
    },
    // Brief subject line
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
        maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    // Detailed description
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    // Optional attachment path
    attachment: {
        type: String
    },
    // Status of the ticket
    status: {
        type: String,
        enum: ['open', 'under_review', 'resolved', 'closed'],
        default: 'open',
        index: true
    },
    // Officer responses
    responses: [{
        message: {
            type: String,
            required: true
        },
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        respondedAt: {
            type: Date,
            default: Date.now
        }
    }],
    // Officer assigned to handle this ticket
    assignedOfficer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Resolved/closed date
    resolvedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// Pre-validate hook to generate ticket ID (before validation so required passes)
grievanceTicketSchema.pre('validate', async function (next) {
    if (this.isNew && !this.ticketId) {
        try {
            const year = new Date().getFullYear();
            const counter = await Counter.findByIdAndUpdate(
                { _id: 'ticketId' },
                { $inc: { seq: 1 } },
                { new: true, upsert: true }
            );
            this.ticketId = `GRV-${year}-${String(counter.seq).padStart(4, '0')}`;
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Indexes for better query performance
grievanceTicketSchema.index({ userId: 1, createdAt: -1 });
grievanceTicketSchema.index({ status: 1, createdAt: -1 });
grievanceTicketSchema.index({ caseId: 1, createdAt: -1 });

const GrievanceTicket = mongoose.model('GrievanceTicket', grievanceTicketSchema);

module.exports = GrievanceTicket;
