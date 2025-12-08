import React, { useState, useEffect } from 'react';
import { documentAPI } from '../services/api';
import './DocumentUpload.css';

const DocumentUpload = ({ grievanceId, onUploadComplete }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [documentType, setDocumentType] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedDocs, setUploadedDocs] = useState([]);
    const [error, setError] = useState('');

    const documentTypes = [
        { value: 'aadhaar', label: 'Aadhaar Card', icon: '🆔' },
        { value: 'fir', label: 'FIR Copy', icon: '📄' },
        { value: 'medical', label: 'Medical Report', icon: '🏥' },
        { value: 'bankPassbook', label: 'Bank Passbook', icon: '🏦' },
        { value: 'casteCertificate', label: 'Caste Certificate', icon: '📜' },
        { value: 'other', label: 'Other Supporting Documents', icon: '📎' }
    ];

    useEffect(() => {
        if (grievanceId) {
            fetchUploadedDocuments();
        }
    }, [grievanceId]);

    const fetchUploadedDocuments = async () => {
        try {
            const response = await documentAPI.getByGrievance(grievanceId);
            setUploadedDocs(response.data);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }

            // Validate file type
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                setError('Only PDF and image files (JPEG, PNG) are allowed');
                return;
            }

            setSelectedFile(file);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !documentType) {
            setError('Please select a file and document type');
            return;
        }

        // Check if this document type already uploaded
        const alreadyUploaded = uploadedDocs.some(doc => doc.documentType === documentType);
        if (alreadyUploaded) {
            setError(`${documentTypes.find(t => t.value === documentType)?.label} has already been uploaded`);
            return;
        }

        setUploading(true);
        setError('');

        try {
            await documentAPI.upload(selectedFile, grievanceId, documentType);

            // Success
            setUploadProgress(100);
            setTimeout(() => {
                setSelectedFile(null);
                setDocumentType('');
                setUploadProgress(0);
                fetchUploadedDocuments();
                if (onUploadComplete) {
                    onUploadComplete();
                }
            }, 1000);
        } catch (error) {
            setError(error.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const getRemainingDocTypes = () => {
        const uploadedTypes = uploadedDocs.map(doc => doc.documentType);
        return documentTypes.filter(type => !uploadedTypes.includes(type.value));
    };

    return (
        <div className="document-upload-container">
            <h3>📤 Upload Documents</h3>
            <p className="upload-instruction">Please upload the following documents to complete your application:</p>

            {/* Uploaded Documents Status */}
            {uploadedDocs.length > 0 && (
                <div className="uploaded-docs-status">
                    <h4>✅ Uploaded Documents ({uploadedDocs.length})</h4>
                    <div className="uploaded-list">
                        {uploadedDocs.map(doc => (
                            <div key={doc.documentId} className="uploaded-item">
                                <span className="doc-icon">{documentTypes.find(t => t.value === doc.documentType)?.icon}</span>
                                <span className="doc-name">{documentTypes.find(t => t.value === doc.documentType)?.label}</span>
                                <span className="doc-size">{(doc.fileSize / 1024).toFixed(1)} KB</span>
                                <span className="check-mark">✓</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upload Form */}
            {getRemainingDocTypes().length > 0 ? (
                <div className="upload-form">
                    <div className="form-group">
                        <label>Document Type *</label>
                        <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            disabled={uploading}
                        >
                            <option value="">Select Document Type</option>
                            {getRemainingDocTypes().map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.icon} {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Select File (PDF, JPEG, PNG - Max 10MB) *</label>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileSelect}
                            disabled={uploading}
                            className="file-input"
                        />
                        {selectedFile && (
                            <div className="selected-file">
                                <span>📎 {selectedFile.name}</span>
                                <span className="file-size">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                            </div>
                        )}
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    {/* Upload Progress */}
                    {uploading && (
                        <div className="upload-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                            </div>
                            <p>Uploading... {uploadProgress}%</p>
                        </div>
                    )}

                    <button
                        onClick={handleUpload}
                        disabled={uploading || !selectedFile || !documentType}
                        className="upload-button"
                    >
                        {uploading ? '⏳ Uploading...' : '📤 Upload Document'}
                    </button>
                </div>
            ) : (
                <div className="all-uploaded">
                    <p>✅ All required documents have been uploaded!</p>
                </div>
            )}

            {/* Info Box */}
            <div className="info-box">
                <h4>ℹ️ Important</h4>
                <ul>
                    <li>Only PDF and image files are accepted</li>
                    <li>Maximum file size: 10MB per document</li>
                    <li>Ensure documents are clear and readable</li>
                    <li>Each document can only be uploaded once</li>
                </ul>
            </div>
        </div>
    );
};

export default DocumentUpload;
