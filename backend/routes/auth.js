const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateOTP, verifyOTP, deleteOTP } = require('../services/otpService');
const { sendSMS } = require('../services/smsService');
const auth = require('../middleware/auth');

const router = express.Router();

// Send OTP
router.post('/send-otp', [
    body('mobile').matches(/^[0-9]{10}$/).withMessage('Mobile number must be 10 digits')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { mobile } = req.body;
        const otp = generateOTP(mobile);

        // In production, send actual SMS
        if (process.env.NODE_ENV === 'production') {
            await sendSMS(mobile, `Your Trace Lens OTP is: ${otp}. Valid for 5 minutes.`);
        }

        console.log(`OTP for ${mobile}: ${otp}`); // For development

        res.json({ 
            message: 'OTP sent successfully',
            // In development, send OTP in response
            ...(process.env.NODE_ENV !== 'production' && { otp })
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
});

// Login with OTP
router.post('/login', [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('mobile').matches(/^[0-9]{10}$/).withMessage('Mobile number must be 10 digits'),
    body('otp').matches(/^[0-9]{6}$/).withMessage('OTP must be 6 digits')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, mobile, otp } = req.body;

        // Verify OTP
        const isOTPValid = verifyOTP(mobile, otp);
        if (!isOTPValid) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Find or create user
        let user = await User.findOne({ email });
        if (!user) {
            const hashedPassword = await bcrypt.hash(password, 12);
            user = new User({
                email,
                password: hashedPassword,
                mobile,
                isVerified: true
            });
            await user.save();
        } else {
            // Verify password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Invalid credentials' });
            }
        }

        // Delete used OTP
        deleteOTP(mobile);

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                mobile: user.mobile
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json(user);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Logout
router.post('/logout', auth, (req, res) => {
    // In production, you might want to blacklist the token
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;

