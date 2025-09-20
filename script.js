import React, { useState } from "react"; 
import { User, Heart, Phone, Save, Send, Camera, CheckCircle } from 'lucide-react';
import './style.css';

// Global Variables
let currentImage = null;
let scanCount = 1247832;
let analysisInProgress = false;
let chatHistory = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize application
function initializeApp() {
    setupEventListeners();
    startCounterAnimation();
    setupDragAndDrop();
}

// Setup event listeners
function setupEventListeners() {
    // File input handler
    document.getElementById('fileInput').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && isValidImageFile(file)) {
            displayImagePreview(file);
            startAnalysis();
        } else if (file) {
            showError('Please select a valid image file (JPG, PNG, GIF, WebP)');
        }
    });

    // Chat input enter key handler
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    // URL input enter key handler
    document.getElementById('urlInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            analyzeFromUrl();
        }
    });
}

// Setup drag and drop functionality
function setupDragAndDrop() {
    const uploadSection = document.getElementById('uploadSection');
    
    uploadSection.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadSection.classList.add('dragover');
    });

    uploadSection.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
    });

    uploadSection.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (isValidImageFile(file)) {
                displayImagePreview(file);
                startAnalysis();
            } else {
                showError('Please drop a valid image file (JPG, PNG, GIF, WebP)');
            }
        }
    });
}

// Validate image file
function isValidImageFile(file) {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
}

// Counter animation for global scans
function startCounterAnimation() {
    setInterval(function() {
        scanCount += Math.floor(Math.random() * 5) + 1;
        document.getElementById('global-scans').textContent = scanCount.toLocaleString() + ' Scans';
    }, 3000);
}

// URL analysis
function analyzeFromUrl() {
    const url = document.getElementById('urlInput').value.trim();
    if (url) {
        if (isValidImageUrl(url)) {
            displayImagePreviewFromUrl(url);
            startAnalysis();
        } else {
            showError('Please enter a valid image URL');
        }
    }
}

// Validate image URL
function isValidImageUrl(url) {
    try {
        new URL(url);
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        return imageExtensions.some(ext => url.toLowerCase().includes(ext)) || 
               url.includes('imgur.com') || 
               url.includes('unsplash.com') ||
               url.includes('pexels.com');
    } catch {
        return false;
    }
}

// Display image preview from file
function displayImagePreview(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('holographicPreview');
        const img = document.getElementById('previewImage');
        img.src = e.target.result;
        img.onerror = function() {
            showError('Failed to load image preview');
        };
        preview.classList.add('active');
        currentImage = e.target.result;
        enableButtons();
    };
    reader.readAsDataURL(file);
}

// Display image preview from URL
function displayImagePreviewFromUrl(url) {
    const preview = document.getElementById('holographicPreview');
    const img = document.getElementById('previewImage');
    
    img.onload = function() {
        preview.classList.add('active');
        currentImage = url;
        enableButtons();
    };
    
    img.onerror = function() {
        showError('Failed to load image from URL');
    };
    
    img.src = url;
}

// Enable buttons after image is loaded
function enableButtons() {
    document.getElementById('heatmapToggle').disabled = false;
    document.getElementById('reportBtn').disabled = false;
}

// Start analysis simulation
function startAnalysis() {
    if (analysisInProgress) return;
    
    analysisInProgress = true;
    showLoadingIndicator(true);
    clearPreviousResults();

    // Simulate analysis steps with realistic timing
    setTimeout(() => addMapPoints(), 1000);
    setTimeout(() => populateMatchResults(), 2000);
    setTimeout(() => populateTimeline(), 3000);
    setTimeout(() => {
        updateCredibilityScore();
        showLoadingIndicator(false);
        analysisInProgress = false;
        addChatMessage('AI Assistant', 'Analysis complete! I found several interesting findings. Ask me about any specific aspect.');
    }, 4000);
}

// Show/hide loading indicator
function showLoadingIndicator(show) {
    const indicator = document.getElementById('loadingIndicator');
    indicator.style.display = show ? 'flex' : 'none';
}

// Clear previous analysis results
function clearPreviousResults() {
    // Clear map points
    const existingPoints = document.querySelectorAll('.map-point');
    existingPoints.forEach(point => point.remove());

    // Clear timeline points
    const timeline = document.getElementById('timeline');
    const existingTimelinePoints = timeline.querySelectorAll('.timeline-point');
    existingTimelinePoints.forEach(point => point.remove());

    // Clear match results
    const matchResults = document.getElementById('matchResults');
    matchResults.innerHTML = '<div class="no-results"><p style="color: #666; font-style: italic; text-align: center; padding: 20px;">Analyzing...</p></div>';

    // Reset credibility score
    document.getElementById('credibilityFill').style.width = '0%';
    document.getElementById('credibilityScore').textContent = '--';
}

// Add map points with realistic locations
function addMapPoints() {
    const map = document.getElementById('worldMap');
    const locations = [
        {x: '25%', y: '40%', confidence: 'high', source: 'Reuters (UK)', time: '2 hours ago'},
        {x: '55%', y: '35%', confidence: 'medium', source: 'Social Media (Germany)', time: '5 hours ago'},
        {x: '75%', y: '45%', confidence: 'high', source: 'News Portal (India)', time: '1 hour ago'},
        {x: '40%', y: '60%', confidence: 'low', source: 'Blog (Brazil)', time: '1 day ago'},
        {x: '15%', y: '30%', confidence: 'medium', source: 'Forum (USA)', time: '3 hours ago'}
    ];
    
    locations.forEach((loc, index) => {
        setTimeout(() => {
            const point = document.createElement('div');
            point.className = 'map-point';
            point.style.left = loc.x;
            point.style.top = loc.y;
            point.title = `${loc.source}\nConfidence: ${loc.confidence}\nFound: ${loc.time}`;
            
            // Add click event for detailed info
            point.addEventListener('click', () => {
                addChatMessage('AI Assistant', `This location shows a match from ${loc.source} with ${loc.confidence} confidence, found ${loc.time}.`);
            });
            
            map.appendChild(point);
        }, index * 500);
    });
}

// Populate match results with detailed information
function populateMatchResults() {
    const container = document.getElementById('matchResults');
    const matches = [
        {
            source: 'reuters.com/world-news',
            confidence: 94,
            type: 'high-confidence',
            timestamp: '2 hours ago',
            metadata: 'Original source, verified'
        },
        {
            source: 'twitter.com/breaking_news',
            confidence: 87,
            type: 'high-confidence',
            timestamp: '3 hours ago',
            metadata: 'Cropped version'
        },
        {
            source: 'facebook.com/news-page',
            confidence: 76,
            type: 'medium-confidence',
            timestamp: '5 hours ago',
            metadata: 'Compressed, watermarked'
        },
        {
            source: 'suspicious-blog.net',
            confidence: 45,
            type: 'low-confidence',
            timestamp: '1 day ago',
            metadata: 'Potentially altered'
        },
        {
            source: 'imgur.com/gallery',
            confidence: 89,
            type: 'high-confidence',
            timestamp: '1 hour ago',
            metadata: 'High resolution match'
        }
    ];
    
    container.innerHTML = ''; // Clear loading message
    
    matches.forEach((match, index) => {
        setTimeout(() => {
            const item = document.createElement('div');
            item.className = `match-item ${match.type}`;
            item.innerHTML = `
                <div>
                    <strong>${match.source}</strong>
                    <br><small>${match.metadata} • ${match.timestamp}</small>
                </div>
                <div class="confidence-score ${match.type.split('-')[0]}">
                    ${match.confidence}%
                </div>
            `;
            
            // Add click event for more details
            item.addEventListener('click', () => {
                addChatMessage('AI Assistant', `Match from ${match.source}: ${match.confidence}% confidence. ${match.metadata}. Found ${match.timestamp}.`);
            });
            
            container.appendChild(item);
        }, index * 400);
    });
}

// Populate timeline with evolution data
function populateTimeline() {
    const timeline = document.getElementById('timeline');
    const points = [
        {type: 'verified', date: '2024-01-15', source: 'Original publication', description: 'First appearance on news website'},
        {type: 'verified', date: '2024-01-16', source: 'Social sharing', description: 'Shared on official social media'},
        {type: 'suspicious', date: '2024-02-08', source: 'Blog repost', description: 'Posted without attribution'},
        {type: 'altered', date: '2024-03-12', source: 'Manipulated version', description: 'Colors enhanced, text added'},
        {type: 'verified', date: '2024-03-20', source: 'Fact-check', description: 'Verified by fact-checking site'}
    ];
    
    points.forEach((point, index) => {
        setTimeout(() => {
            const element = document.createElement('div');
            element.className = `timeline-point ${point.type}`;
            element.title = `${point.date}\n${point.source}\n${point.description}`;
            
            // Add click event for timeline details
            element.addEventListener('click', () => {
                addChatMessage('AI Assistant', `Timeline point: ${point.date} - ${point.description} (${point.source})`);
            });
            
            timeline.appendChild(element);
        }, index * 500);
    });
}

// Update credibility score with animation
function updateCredibilityScore() {
    const score = Math.floor(Math.random() * 30) + 70; // 70-100 for realistic credibility
    const fill = document.getElementById('credibilityFill');
    const scoreElement = document.getElementById('credibilityScore');
    
    fill.style.width = score + '%';
    
    // Animate score counter
    let currentScore = 0;
    const increment = score / 60; // Slower animation for better effect
    const timer = setInterval(() => {
        currentScore += increment;
        if (currentScore >= score) {
            currentScore = score;
            clearInterval(timer);
        }
        scoreElement.textContent = Math.floor(currentScore) + '%';
    }, 30);
}

// Toggle manipulation heatmap
function toggleHeatmap() {
    const heatmap = document.getElementById('heatmapOverlay');
    const button = document.getElementById('heatmapToggle');
    
    heatmap.classList.toggle('active');
    
    if (heatmap.classList.contains('active')) {
        button.textContent = '🔥 Hide Heatmap';
        addChatMessage('AI Assistant', 'Heatmap activated. Red areas indicate potential manipulation. Yellow areas show compression artifacts.');
    } else {
        button.textContent = '🔥 Toggle Manipulation Heatmap';
    }
}

// Download report functionality
function downloadReport() {
    if (!currentImage) {
        showError('Please analyze an image first');
        return;
    }

    addChatMessage('AI Assistant', 'Generating comprehensive PDF report with all analysis data...');
    
    // Simulate report generation
    setTimeout(() => {
        const reportData = generateReportData();
        downloadTextReport(reportData);
        addChatMessage('AI Assistant', 'Report downloaded successfully! The report contains detailed findings, source analysis, and credibility assessment.');
    }, 2000);
}

// Generate report data
function generateReportData() {
    const timestamp = new Date().toLocaleString();
    const credibilityScore = document.getElementById('credibilityScore').textContent;
    
    return `
TRACELENS ANALYSIS REPORT
========================
Generated: ${timestamp}

IMAGE ANALYSIS SUMMARY
=====================
Overall Credibility Score: ${credibilityScore}
Analysis Status: Complete
Image Source: ${currentImage ? 'Uploaded' : 'URL'}

FINDINGS
========
• Found 5 matching sources across different platforms
• Timeline spans 3 months with 5 key events
• Manipulation probability: Low to Medium
• Original source identified with high confidence

SOURCE ANALYSIS
===============
1. reuters.com/world-news (94% confidence) - Original source
2. twitter.com/breaking_news (87% confidence) - Cropped version  
3. facebook.com/news-page (76% confidence) - Compressed version
4. suspicious-blog.net (45% confidence) - Potentially altered
5. imgur.com/gallery (89% confidence) - High resolution match

GEOGRAPHIC DISTRIBUTION
======================
• Primary sources: UK, Germany, India, Brazil, USA
• Highest activity: Europe and Asia
• Suspicious activity detected in: 1 location

TECHNICAL ANALYSIS
==================
• EXIF data: Partially preserved
• Compression: Multiple generations detected
• Alterations: Minor color enhancement detected
• Metadata: Timestamps consistent with claimed dates

RECOMMENDATIONS
===============
• Source verification recommended for low-confidence matches
• Monitor for additional manipulated versions
• Cross-reference with fact-checking databases
• Consider reverse image search on additional platforms

This report was generated by TraceLens AI Analysis System.
For questions, contact: support@tracelens.com
    `;
}

// Download text report (fallback for PDF)
function downloadTextReport(data) {
    const blob = new Blob([data], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracelens-report-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Chat functionality
function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        addChatMessage('You', message);
        input.value = '';
        
        // Generate AI response
        setTimeout(() => {
            const response = generateAIResponse(message);
            addChatMessage('AI Assistant', response);
        }, 1000);
    }
}

// Handle chat enter key
function handleChatEnter(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

// Add message to chat
function addChatMessage(sender, message) {
    const messages = document.getElementById('chatMessages');
    const messageElement = document.createElement('p');
    
    if (sender === 'You') {
        messageElement.innerHTML = `<strong style="color: #ffffff;">${sender}:</strong> ${message}`;
    } else {
        messageElement.innerHTML = `<strong style="color: #8b0000;">${sender}:</strong> ${message}`;
    }
    
    messageElement.style.marginBottom = '10px';
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
    
    // Store in history
    chatHistory.push({sender, message, timestamp: new Date()});
}

// Generate AI responses based on context
function generateAIResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    // Context-aware responses based on analysis state
    if (!currentImage) {
        return "Please upload an image first to start the analysis. I'll be able to provide detailed insights once the analysis is complete.";
    }
    
    if (message.includes('confidence') || message.includes('score')) {
        const score = document.getElementById('credibilityScore').textContent;
        return `The current credibility score is ${score}. This is based on source verification, manipulation detection, and timeline analysis. Scores above 80% indicate high reliability.`;
    }
    
    if (message.includes('source') || message.includes('where')) {
        return "I found 5 primary sources for this image: Reuters (94% confidence), Twitter (87%), Facebook (76%), a suspicious blog (45%), and Imgur (89%). The Reuters source appears to be the original.";
    }
    
    if (message.includes('fake') || message.includes('real')) {
        return "Based on the analysis, this image shows high authenticity markers. The original source is verified, though some versions show minor alterations like color enhancement.";
    }
    
    if (message.includes('timeline') || message.includes('when')) {
        return "The image timeline shows first appearance in January 2024 on a news website, followed by social sharing. A potentially manipulated version appeared in March 2024.";
    }
    
    if (message.includes('manipulation') || message.includes('edited')) {
        return "The manipulation analysis detected minor alterations in some versions - primarily color enhancement and compression. The heatmap shows areas of concern in red and yellow.";
    }
    
    if (message.includes('help') || message.includes('what can')) {
        return "I can help you understand the image analysis results, explain confidence scores, discuss sources, analyze the timeline, or provide insights about potential manipulations. What would you like to know more about?";
    }
    
    if (message.includes('report') || message.includes('download')) {
        return "I can generate a comprehensive PDF report with all analysis findings. The report includes source verification, timeline analysis, technical details, and recommendations. Click the 'Download PDF Report' button to get it.";
    }
    
    // Default responses with variety
    const defaultResponses = [
        "Based on the current analysis, I can see several interesting patterns. The image has been traced across multiple platforms with varying confidence levels.",
        "The AI analysis shows promising results. The source verification indicates legitimate origins with some secondary sharing that introduced minor alterations.",
        "Looking at the data, this image demonstrates typical propagation patterns across social media and news platforms. Would you like me to elaborate on any specific aspect?",
        "The forensic analysis reveals important details about the image's journey through various platforms. The credibility indicators are generally positive.",
        "Interesting question! The analysis results show a complex but trackable path for this image across the internet. The verification markers suggest authentic origins."
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Error handling
function showError(message) {
    addChatMessage('AI Assistant', `⚠ ${message}`);
}

// Utility functions
function formatTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
}

function getRandomId() {
    return Math.random().toString(36).substr(2, 9);
}

// Export functions for potential external use
window.TraceLens = {
    analyzeFromUrl,
    toggleHeatmap,
    downloadReport,
    sendChatMessage
};
