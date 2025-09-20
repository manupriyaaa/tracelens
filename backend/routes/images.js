const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Image = require('../models/Image');
const { detectFaces } = require('../services/visionService');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 10 // Maximum 10 files
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files (jpeg, jpg, png, webp) are allowed'));
        }
    }
});

// Upload images
router.post('/upload', auth, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No images uploaded' });
        }

        const uploadedImages = [];

        for (const file of req.files) {
            const image = new Image({
                userId: req.userId,
                filename: file.filename,
                originalName: file.originalname,
                path: file.path,
                size: file.size,
                mimetype: file.mimetype
            });

            await image.save();
            uploadedImages.push(image);
        }

        res.json({
            message: 'Images uploaded successfully',
            images: uploadedImages
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Failed to upload images' });
    }
});

// Detect faces in uploaded images
router.post('/detect-faces', auth, async (req, res) => {
    try {
        const { imageIds } = req.body;

        if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
            return res.status(400).json({ message: 'No image IDs provided' });
        }

        const results = [];

        for (const imageId of imageIds) {
            const image = await Image.findOne({ _id: imageId, userId: req.userId });
            if (!image) {
                continue;
            }

            try {
                // Run face detection
                const faceDetectionResults = await detectFaces(image.path);

                // Update image with results
                image.faceDetectionResults = faceDetectionResults;
                image.processed = true;
                image.processedAt = new Date();
                await image.save();

                results.push({
                    imageId: image._id,
                    filename: image.filename,
                    results: faceDetectionResults
                });
            } catch (detectionError) {
                console.error(`Face detection failed for image ${imageId}:`, detectionError);
                results.push({
                    imageId: image._id,
                    filename: image.filename,
                    error: 'Face detection failed'
                });
            }
        }

        res.json({
            message: 'Face detection completed',
            results
        });
    } catch (error) {
        console.error('Face detection error:', error);
        res.status(500).json({ message: 'Face detection failed' });
    }
});

// Get user's images
router.get('/', auth, async (req, res) => {
    try {
        const images = await Image.find({ userId: req.userId })
            .sort({ uploadedAt: -1 })
            .select('-path'); // Don't expose file paths

        res.json({ images });
    } catch (error) {
        console.error('Get images error:', error);
        res.status(500).json({ message: 'Failed to fetch images' });
    }
});

// Delete image
router.delete('/:id', auth, async (req, res) => {
    try {
        const image = await Image.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.userId 
        });

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        // In production, also delete the file from storage
        const fs = require('fs');
        if (fs.existsSync(image.path)) {
            fs.unlinkSync(image.path);
        }

        res.json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('Delete image error:', error);
        res.status(500).json({ message: 'Failed to delete image' });
    }
});

module.exports = router;

