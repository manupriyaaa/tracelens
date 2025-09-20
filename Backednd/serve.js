const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const canvas = require('canvas');
const faceapi = require('face-api.js');

// Setup canvas for face-api.js
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check if file is an image
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false);
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Global variable to store loaded models
let modelsLoaded = false;

// Load face-api.js models
async function loadModels() {
  try {
    console.log('Loading face detection models...');
    
    // Create models directory if it doesn't exist
    const modelsDir = path.join(__dirname, 'models');
    if (!fs.existsSync(modelsDir)) {
      fs.mkdirSync(modelsDir, { recursive: true });
    }

    // Load models (you'll need to download these from face-api.js repository)
    await faceapi.nets.tinyFaceDetector.loadFromDisk(modelsDir);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(modelsDir);
    
    modelsLoaded = true;
    console.log('Face detection models loaded successfully!');
  } catch (error) {
    console.error('Error loading models:', error);
    console.log('Please download the required models from: https://github.com/justadudewhohacks/face-api.js/tree/master/weights');
    console.log('Place them in the "models" directory');
  }
}

// Helper function to convert buffer to canvas image
async function bufferToImage(buffer) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = buffer;
  });
}

// Helper function to draw bounding boxes on image
async function drawBoundingBoxes(imageBuffer, detections) {
  try {
    const img = await bufferToImage(imageBuffer);
    const canvasEl = canvas.createCanvas(img.width, img.height);
    const ctx = canvasEl.getContext('2d');
    
    // Draw the original image
    ctx.drawImage(img, 0, 0);
    
    // Draw bounding boxes
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    
    detections.forEach(detection => {
      const box = detection.detection.box;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      
      // Add face confidence score
      ctx.fillStyle = '#00ff00';
      ctx.font = '16px Arial';
      ctx.fillText(
        `${Math.round(detection.detection.score * 100)}%`,
        box.x,
        box.y - 5
      );
    });
    
    return canvasEl.toBuffer('image/png');
  } catch (error) {
    console.error('Error drawing bounding boxes:', error);
    throw error;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    modelsLoaded: modelsLoaded,
    timestamp: new Date().toISOString()
  });
});

// Main face detection endpoint
app.post('/detect-faces', upload.single('image'), async (req, res) => {
  try {
    // Check if models are loaded
    if (!modelsLoaded) {
      return res.status(503).json({
        error: 'Face detection models not loaded. Please check server logs.',
        success: false
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file uploaded',
        success: false
      });
    }

    console.log(`Processing image: ${req.file.originalname}, Size: ${req.file.size} bytes`);

    // Convert buffer to image
    const img = await bufferToImage(req.file.buffer);
    
    // Perform face detection
    const detections = await faceapi
      .detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    console.log(`Detected ${detections.length} faces`);

    // Format the response
    const faces = detections.map(detection => {
      const box = detection.detection.box;
      return {
        top: Math.round(box.y),
        right: Math.round(box.x + box.width),
        bottom: Math.round(box.y + box.height),
        left: Math.round(box.x),
        confidence: Math.round(detection.detection.score * 100) / 100,
        width: Math.round(box.width),
        height: Math.round(box.height)
      };
    });

    // Prepare response
    const response = {
      success: true,
      faces: faces,
      totalFaces: faces.length,
      imageInfo: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        dimensions: {
          width: img.width,
          height: img.height
        }
      }
    };

    // If requested, include image with bounding boxes
    if (req.query.includeBoundingBoxes === 'true' && faces.length > 0) {
      try {
        const imageWithBoxes = await drawBoundingBoxes(req.file.buffer, detections);
        response.imageWithBoundingBoxes = `data:image/png;base64,${imageWithBoxes.toString('base64')}`;
      } catch (error) {
        console.error('Error creating image with bounding boxes:', error);
        response.boundingBoxError = 'Could not generate image with bounding boxes';
      }
    }

    res.json(response);

  } catch (error) {
    console.error('Face detection error:', error);
    
    if (error.message.includes('Only image files are allowed')) {
      return res.status(400).json({
        error: error.message,
        success: false
      });
    }
    
    res.status(500).json({
      error: 'Internal server error during face detection',
      details: error.message,
      success: false
    });
  }
});

// Serve the HTML frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large. Maximum size is 10MB.',
        success: false
      });
    }
  }
  
  if (error.message.includes('Only image files are allowed')) {
    return res.status(400).json({
      error: error.message,
      success: false
    });
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    success: false
  });
});

// Start server
async function startServer() {
  await loadModels();
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Face detection API available at: http://localhost:${PORT}/detect-faces`);
    console.log(`Models loaded: ${modelsLoaded}`);
  });
}

startServer().catch(console.error);

module.exports = app;