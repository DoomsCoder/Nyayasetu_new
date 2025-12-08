import React, { useState, useEffect } from 'react';
import { documentAPI } from '../services/api';
import './DocumentViewer.css';

const DocumentViewer = ({ grievanceId }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const documentTypes = {
        aadhaar: { label: 'Aadhaar Card', icon: '🆔' },
        fir: { label: 'FIR Copy', icon: '📄' },
        medical: { label: 'Medical Report', icon: '🏥' },
        bankPassbook: { label: 'Bank Passbook', icon: '🏦' },
        casteCertificate: { label: 'Caste Certificate', icon: '📜' },
        other: { label: 'Other Documents', icon: '📎' }
    };

    useEffect(() => {
        if (grievanceId) {
            fetchDocuments();
        }
    }, [grievanceId]);

    const fetchDocuments = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await documentAPI.getByGrievance(grievanceId);
            setDocuments(response.data || []);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
            setError('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const handleView = async (document) => {
        try {
            // Fetch the file with authentication (don't pass fileName to get blob)
            const blob = await documentAPI.download(document.documentId, null);

            // Create blob URL and open in new tab
            const url = window.URL.createObjectURL(new Blob([blob], { type: document.mimeType || 'application/pdf' }));
            window.open(url, '_blank');

            // Clean up after a delay
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (error) {
            alert('Failed to view document: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDownload = async (document) => {
        try {
            await documentAPI.download(document.documentId, document.fileName);
        } catch (error) {
            alert('Failed to download document: ' + (error.response?.data?.message || error.message));
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (loading) {
        return (
            <div className="document-viewer loading">
                <div className="spinner"></div>
                <p>Loading documents...</p>
            </div>
        );
    }

    return (
        <div className="document-viewer">
            <div className="viewer-header">
                <h3>📂 Submitted Documents</h3>
                <span className="doc-count">{documents.length} {documents.length === 1 ? 'document' : 'documents'}</span>
            </div>

            {error && (
                <div className="error-alert">
                    <span>⚠️</span>
                    <p>{error}</p>
                </div>
            )}

            {documents.length === 0 ? (
                <div className="no-documents">
                    <div className="empty-icon">📭</div>
                    <h4>No Documents Yet</h4>
                    <p>No documents have been uploaded for this case.</p>
                </div>
            ) : (
                <div className="documents-grid">
                    {documents.map((doc) => {
                        const docMeta = documentTypes[doc.documentType] || { label: doc.documentType, icon: '📄' };

                        return (
                            <div key={doc.documentId} className="document-card">
                                <div className="doc-header">
                                    <div className="doc-icon-large">{docMeta.icon}</div>
                                    <div className="doc-info-main">
                                        <h4>{docMeta.label}</h4>
                                        <p className="doc-filename">{doc.fileName}</p>
                                    </div>
                                </div>

                                <div className="doc-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Size:</span>
                                        <span className="meta-value">{formatSize(doc.fileSize)}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Uploaded:</span>
                                        <span className="meta-value">{formatDate(doc.uploadedAt)}</span>
                                    </div>
                                </div>

                                <div className="doc-actions">
                                    <button
                                        onClick={() => handleView(doc)}
                                        className="btn-view"
                                    >
                                        <span>👁️</span> View
                                    </button>
                                    <button
                                        onClick={() => handleDownload(doc)}
                                        className="btn-download"
                                    >
                                        <span>⬇️</span> Download
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default DocumentViewer;
