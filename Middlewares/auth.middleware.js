const jwt = require('jsonwebtoken');
const asyncHandler = require('../Utility/asyncHandler');
const ApiError = require('../Utility/ApiError');

// Middleware to authenticate using access token
const authenticateToken = asyncHandler(async (req, res, next) => {
    try {

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];


        if (!token) {
            return res.status(401).json({ error: 'Access token is missing' });
        }

        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ error: 'Invalid or expired access token' });
            }
            req.user = user; // The decoded token payload (e.g., { phoneNumberId: ... })
            next();
        });
    } catch (error) {
        throw new ApiError(401, err?.message || "Invalid access token");
    }
});

module.exports = authenticateToken