const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send email using SendGrid
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content (optional)
 */
const sendEmail = async (options) => {
    try {
        const msg = {
            to: options.to,
            from: process.env.EMAIL_FROM || 'noreply@nyayasetu.gov.in',
            subject: options.subject,
            text: options.text,
            html: options.html || options.text
        };

        await sgMail.send(msg);
        console.log(`✅ Email sent to ${options.to}`);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error.response?.body || error.message);
        throw new Error('Email could not be sent');
    }
};

module.exports = sendEmail;
