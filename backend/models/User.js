const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    mobile: {
        type: String,
        required: true,
        match: /^[0-9]{10}$/
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date
    },
    profile: {
        firstName: String,
        lastName: String,
        avatar: String
    }
});

// Index for performance
userSchema.index({ email: 1 });
userSchema.index({ mobile: 1 });

module.exports = mongoose.model('User', userSchema);

