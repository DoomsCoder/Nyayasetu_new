const Document = require('../models/Document');
const Grievance = require('../models/Grievance');
const storageService = require('../services/localStorageService');

/**
 * Upload a document to Google Drive
 * POST /api/documents/upload
 */
exports.uploadDocument = async (req, res) => {
    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { grievanceId, documentType } = req.body;

        // Validate required fields
        if (!grievanceId || !documentType) {
            return res.status(400).json({
                success: false,
                message: 'Grievance ID and document type are required'
            });
        }

        // Verify grievance exists and belongs to user
        const grievance = await Grievance.findById(grievanceId);
        if (!grievance) {
            return res.status(404).json({
                success: false,
                message: 'Grievance not found'
            });
        }

        // Check if user owns this grievance (unless they're an officer/admin)
        if (req.user.role === 'victim' && grievance.userId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to upload documents to this grievance'
            });
        }

        // Check if document of this type already exists
        const existingDoc = await Document.findByType(grievanceId, documentType);
        if (existingDoc) {
            return res.status(400).json({
                success: false,
                message: `A ${documentType} document has already been uploaded for this grievance`
            });
        }

        // Create or get grievance folder in local storage
        const folderId = await storageService.createGrievanceFolder(grievanceId);

        // Upload file to local storage
        const uploadResult = await storageService.uploadFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            folderId
        );

        // Save document metadata to MongoDB
        const document = new Document({
            grievanceId,
            documentType,
            originalFileName: req.file.originalname,
            googleDriveFileId: uploadResult.fileId,
            googleDriveFolderId: folderId,
            googleDriveWebViewLink: uploadResult.webViewLink,
            googleDriveWebContentLink: uploadResult.webContentLink,
            mimeType: req.file.mimetype,
            fileSize: uploadResult.size || req.file.size,
            uploadedBy: req.user.userId
        });

        await document.save();

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: {
                documentId: document._id,
                documentType: document.documentType,
                fileName: document.originalFileName,
                fileSize: document.fileSize,
                uploadedAt: document.uploadedAt
            }
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload document',
            error: error.message
        });
    }
};

/**
 * Get all documents for a grievance
 * GET /api/documents/grievance/:grievanceId
 */
exports.getDocumentsByGrievance = async (req, res) => {
    try {
        const { grievanceId } = req.params;

        // Verify grievance exists
        const grievance = await Grievance.findById(grievanceId);
        if (!grievance) {
            return res.status(404).json({
                success: false,
                message: 'Grievance not found'
            });
        }

        // Check access permissions
        const isOwner = grievance.userId.toString() === req.user.userId;
        const isOfficer = req.user.role === 'officer' || req.user.role === 'admin';

        if (!isOwner && !isOfficer) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view these documents'
            });
        }

        // Get all active documents for this grievance
        const documents = await Document.findByGrievance(grievanceId);

        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents.map(doc => ({
                documentId: doc._id,
                documentType: doc.documentType,
                fileName: doc.originalFileName,
                fileSize: doc.fileSize,
                uploadedAt: doc.uploadedAt,
                uploadedBy: doc.uploadedBy ? {
                    name: doc.uploadedBy.name,
                    email: doc.uploadedBy.email
                } : null
            }))
        });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch documents',
            error: error.message
        });
    }
};

/**
 * Get view URL for a document
 * GET /api/documents/:documentId/view
 */
exports.getDocumentViewUrl = async (req, res) => {
    try {
        const { documentId } = req.params;

        // Find document
        const document = await Document.findById(documentId).populate('grievanceId');
        if (!document || document.status === 'deleted') {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Check access permissions
        const grievance = await Grievance.findById(document.grievanceId);
        const isOwner = grievance.userId.toString() === req.user.userId;
        const isOfficer = req.user.role === 'officer' || req.user.role === 'admin';

        if (!isOwner && !isOfficer) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view this document'
            });
        }

        // For local storage, return the file path that will be served by the download endpoint
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        const viewUrl = `${baseUrl}/api/documents/${documentId}/download`;

        res.status(200).json({
            success: true,
            data: {
                viewUrl: viewUrl,
                downloadUrl: viewUrl,
                fileName: document.originalFileName,
                fileSize: document.fileSize,
                mimeType: document.mimeType
            }
        });
    } catch (error) {
        console.error('Error getting document view URL:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get document view URL',
            error: error.message
        });
    }
};

/**
 * Download a document
 * GET /api/documents/:documentId/download
 */
exports.downloadDocument = async (req, res) => {
    try {
        const { documentId } = req.params;

        // Find document
        const document = await Document.findById(documentId);
        if (!document || document.status === 'deleted') {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Only officers and admins can download
        if (req.user.role !== 'officer' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only officers can download documents'
            });
        }

        // Get file from local storage
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../../uploads');
        const folderPath = path.join(uploadsDir, document.googleDriveFolderId);
        const filePath = path.join(folderPath, document.googleDriveFileId);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found on server'
            });
        }

        // Set response headers
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${document.originalFileName}"`);

        // Create read stream and pipe to response
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download document',
            error: error.message
        });
    }
};

/**
 * Delete a document (soft delete)
 * DELETE /api/documents/:documentId
 */
exports.deleteDocument = async (req, res) => {
    try {
        const { documentId } = req.params;

        // Find document
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document not found'
            });
        }

        // Only admins can delete documents
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Only administrators can delete documents'
            });
        }

        // Soft delete
        await document.softDelete();

        // Optionally delete from Google Drive (commented out for safety)
        // await googleDriveService.deleteFile(document.googleDriveFileId);

        res.status(200).json({
            success: true,
            message: 'Document deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete document',
            error: error.message
        });
    }
};

/**
 * Get document statistics for a grievance
 * GET /api/documents/grievance/:grievanceId/stats
 */
exports.getDocumentStats = async (req, res) => {
    try {
        const { grievanceId } = req.params;

        // Verify grievance exists
        const grievance = await Grievance.findById(grievanceId);
        if (!grievance) {
            return res.status(404).json({
                success: false,
                message: 'Grievance not found'
            });
        }

        // Get documents
        const documents = await Document.find({ grievanceId, status: 'active' });

        const stats = {
            totalDocuments: documents.length,
            totalSize: documents.reduce((sum, doc) => sum + (doc.fileSize || 0), 0),
            documentTypes: {
                aadhaar: documents.some(d => d.documentType === 'aadhaar'),
                fir: documents.some(d => d.documentType === 'fir'),
                medical: documents.some(d => d.documentType === 'medical'),
                bankPassbook: documents.some(d => d.documentType === 'bankPassbook'),
                casteCertificate: documents.some(d => d.documentType === 'casteCertificate')
            }
        };

        res.status(200).json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error getting document stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get document statistics',
            error: error.message
        });
    }
};
