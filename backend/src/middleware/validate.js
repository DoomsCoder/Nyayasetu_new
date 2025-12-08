// Input validation middleware
const validateRegistration = (req, res, next) => {
    const { fullName, email, mobile, password, role } = req.body;
    const errors = [];

    // Validate full name
    if (!fullName || fullName.trim().length < 2) {
        errors.push('Full name must be at least 2 characters');
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        errors.push('Please provide a valid email address');
    }

    // Validate mobile
    if (!mobile || mobile.length < 10) {
        errors.push('Mobile number must be at least 10 digits');
    }

    // Validate password
    if (!password || password.length < 6) {
        errors.push('Password must be at least 6 characters');
    }

    // Validate role
    const validRoles = ['victim', 'officer', 'financial', 'ministry'];
    if (role && !validRoles.includes(role)) {
        errors.push('Invalid role specified');
    }

    // If officer, validate additional fields
    if (role === 'officer') {
        const { district, state, officerId } = req.body;
        if (!district) errors.push('District is required for officers');
        if (!state) errors.push('State is required for officers');
        if (!officerId) errors.push('Officer ID is required for officers');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

// Validate login input
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email) {
        errors.push('Email is required');
    }

    if (!password) {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    next();
};

// Sanitize input to prevent injection attacks
const sanitizeInput = (req, res, next) => {
    // Basic sanitization - remove potential harmful characters
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                // Trim whitespace
                req.body[key] = req.body[key].trim();

                // Remove potential script tags (basic XSS prevention)
                req.body[key] = req.body[key].replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            }
        });
    }
    next();
};

module.exports = {
    validateRegistration,
    validateLogin,
    sanitizeInput
};
