const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

class GoogleDriveService {
    constructor() {
        this.drive = null;
        this.auth = null;
        this.rootFolderId = null;
    }

    /**
     * Initialize Google Drive API with Service Account credentials
     */
    async initialize() {
        try {
            const credentialsPath = path.join(__dirname, '../config/google-drive-credentials.json');

            if (!fs.existsSync(credentialsPath)) {
                throw new Error('Google Drive credentials file not found at: ' + credentialsPath);
            }

            const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

            // Create auth client with Service Account
            this.auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/drive']
            });

            // Create Drive API client
            this.drive = google.drive({ version: 'v3', auth: this.auth });

            // Create or get root folder for NyayaSetu documents
            this.rootFolderId = await this.getOrCreateRootFolder();

            console.log('✅ Google Drive Service initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Google Drive Service:', error.message);
            throw error;
        }
    }

    /**
     * Get or create the root folder for NyayaSetu documents
     */
    async getOrCreateRootFolder() {
        try {
            // Check if folder ID is provided in environment variable
            const envFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
            if (envFolderId) {
                console.log('Using folder ID from environment:', envFolderId);
                return envFolderId;
            }

            // Search for existing root folder
            const response = await this.drive.files.list({
                q: "name='NyayaSetu Documents' and mimeType='application/vnd.google-apps.folder' and trashed=false",
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (response.data.files && response.data.files.length > 0) {
                console.log('Found existing root folder:', response.data.files[0].id);
                return response.data.files[0].id;
            }

            // Create root folder if it doesn't exist
            const folderMetadata = {
                name: 'NyayaSetu Documents',
                mimeType: 'application/vnd.google-apps.folder'
            };

            const folder = await this.drive.files.create({
                resource: folderMetadata,
                fields: 'id'
            });

            console.log('Created root folder:', folder.data.id);
            return folder.data.id;
        } catch (error) {
            console.error('Error creating/getting root folder:', error.message);
            throw error;
        }
    }

    /**
     * Create a folder for a specific grievance
     * @param {string} grievanceId - The grievance ID
     * @returns {string} - Folder ID
     */
    async createGrievanceFolder(grievanceId) {
        try {
            const folderName = `Grievance_${grievanceId}`;

            // Check if folder already exists
            const response = await this.drive.files.list({
                q: `name='${folderName}' and '${this.rootFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });

            if (response.data.files && response.data.files.length > 0) {
                console.log(`Folder for grievance ${grievanceId} already exists`);
                return response.data.files[0].id;
            }

            // Create new folder
            const folderMetadata = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [this.rootFolderId]
            };

            const folder = await this.drive.files.create({
                resource: folderMetadata,
                fields: 'id'
            });

            console.log(`Created folder for grievance ${grievanceId}:`, folder.data.id);
            return folder.data.id;
        } catch (error) {
            console.error('Error creating grievance folder:', error.message);
            throw error;
        }
    }

    /**
     * Upload a file to Google Drive
     * @param {Buffer} fileBuffer - File buffer
     * @param {string} fileName - Original file name
     * @param {string} mimeType - File MIME type
     * @param {string} folderId - Parent folder ID
     * @returns {Object} - File metadata including ID and links
     */
    async uploadFile(fileBuffer, fileName, mimeType, folderId) {
        try {
            const fileMetadata = {
                name: fileName,
                parents: [folderId]
            };

            const media = {
                mimeType: mimeType,
                body: require('stream').Readable.from(fileBuffer)
            };

            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, name, webViewLink, webContentLink, size'
            });

            // Make file viewable by anyone with the link (for officers to view)
            await this.drive.permissions.create({
                fileId: response.data.id,
                requestBody: {
                    role: 'reader',
                    type: 'anyone'
                }
            });

            console.log(`File uploaded successfully: ${response.data.name} (${response.data.id})`);

            return {
                fileId: response.data.id,
                fileName: response.data.name,
                webViewLink: response.data.webViewLink,
                webContentLink: response.data.webContentLink,
                size: response.data.size
            };
        } catch (error) {
            console.error('Error uploading file to Google Drive:', error.message);
            throw error;
        }
    }

    /**
     * Get file metadata and download link
     * @param {string} fileId - Google Drive file ID
     * @returns {Object} - File metadata
     */
    async getFile(fileId) {
        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                fields: 'id, name, webViewLink, webContentLink, mimeType, size'
            });

            return response.data;
        } catch (error) {
            console.error('Error getting file from Google Drive:', error.message);
            throw error;
        }
    }

    /**
     * Delete a file from Google Drive
     * @param {string} fileId - Google Drive file ID
     */
    async deleteFile(fileId) {
        try {
            await this.drive.files.delete({
                fileId: fileId
            });

            console.log(`File deleted: ${fileId}`);
            return true;
        } catch (error) {
            console.error('Error deleting file from Google Drive:', error.message);
            throw error;
        }
    }

    /**
     * Get a readable stream for downloading a file
     * @param {string} fileId - Google Drive file ID
     * @returns {Stream} - Readable stream
     */
    async getFileStream(fileId) {
        try {
            const response = await this.drive.files.get(
                {
                    fileId: fileId,
                    alt: 'media'
                },
                {
                    responseType: 'stream'
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error getting file stream:', error.message);
            throw error;
        }
    }
}

// Create singleton instance
const googleDriveService = new GoogleDriveService();

module.exports = googleDriveService;
