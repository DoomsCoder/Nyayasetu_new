const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

class LocalStorageService {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../../uploads');
        this.initialized = false;
    }

    /**
     * Initialize local storage
     */
    async initialize() {
        try {
            // Create uploads directory if it doesn't exist
            await fs.mkdir(this.uploadsDir, { recursive: true });

            console.log('✅ Local Storage Service initialized successfully');
            console.log('📁 Upload directory:', this.uploadsDir);
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Local Storage Service:', error.message);
            throw error;
        }
    }

    /**
     * Create a folder for a specific grievance
     */
    async createGrievanceFolder(grievanceId) {
        try {
            const folderPath = path.join(this.uploadsDir, `Grievance_${grievanceId}`);
            await fs.mkdir(folderPath, { recursive: true });

            console.log(`Created folder for grievance ${grievanceId}:`, folderPath);
            return folderPath;
        } catch (error) {
            console.error('Error creating grievance folder:', error.message);
            throw error;
        }
    }

    /**
     * Upload a file to local storage
     */
    async uploadFile(fileBuffer, fileName, mimeType, folderPath) {
        try {
            // Generate unique filename to avoid collisions
            const timestamp = Date.now();
            const randomStr = crypto.randomBytes(4).toString('hex');
            const ext = path.extname(fileName);
            const baseName = path.basename(fileName, ext);
            const uniqueFileName = `${baseName}_${timestamp}_${randomStr}${ext}`;

            const filePath = path.join(folderPath, uniqueFileName);

            // Write file to disk
            await fs.writeFile(filePath, fileBuffer);

            const stats = await fs.stat(filePath);

            console.log(`File uploaded successfully: ${uniqueFileName}`);

            return {
                fileId: uniqueFileName,
                fileName: uniqueFileName,
                filePath: filePath,
                webViewLink: `/uploads/${path.basename(folderPath)}/${uniqueFileName}`,
                webContentLink: `/uploads/${path.basename(folderPath)}/${uniqueFileName}`,
                size: stats.size
            };
        } catch (error) {
            console.error('Error uploading file:', error.message);
            throw error;
        }
    }

    /**
     * Get file metadata
     */
    async getFile(fileId, folderPath) {
        try {
            const filePath = path.join(folderPath, fileId);
            const stats = await fs.stat(filePath);

            return {
                id: fileId,
                name: fileId,
                filePath: filePath,
                webViewLink: `/uploads/${path.basename(folderPath)}/${fileId}`,
                webContentLink: `/uploads/${path.basename(folderPath)}/${fileId}`,
                size: stats.size
            };
        } catch (error) {
            console.error('Error getting file:', error.message);
            throw error;
        }
    }

    /**
     * Delete a file
     */
    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
            console.log(`File deleted: ${filePath}`);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error.message);
            throw error;
        }
    }

    /**
     * Get file buffer for download
     */
    async getFileBuffer(filePath) {
        try {
            return await fs.readFile(filePath);
        } catch (error) {
            console.error('Error reading file:', error.message);
            throw error;
        }
    }
}

// Create singleton instance
const localStorageService = new LocalStorageService();

module.exports = localStorageService;
