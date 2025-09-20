const mongoose = require('mongoose');

const faceSchema = new mongoose.Schema({
    boundingBox: {
        x: Number,
        y: Number,
        width: Number,
        height: Number
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1
    },
    landmarks: [{
        type: String,
        x: Number,
        y: Number
    }],
    emotions: [{
        emotion: String,
        confidence: Number
    }],
    ageRange: {
        low: Number,
        high: Number
    },
    gender: {
        value: String,
        confidence: Number
    }
});

const imageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    processed: {
        type: Boolean,
        default: false
    },
    processedAt: {
        type: Date
    },
    faceDetectionResults: {
        faces: [faceSchema],
        faceCount: Number,
        processingTime: Number,
        imageWidth: Number,
        imageHeight: Number
    },
    metadata: {
        camera: String,
        location: {
            latitude: Number,
            longitude: Number
        },
        timestamp: Date
    }
});

// Indexes for performance
imageSchema.index({ userId: 1, uploadedAt: -1 });
imageSchema.index({ processed: 1 });

module.exports = mongoose.model('Image', imageSchema);

