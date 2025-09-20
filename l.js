import React, { useState } from "react"; 
import { User, Heart, Phone, Save, Send, Camera, CheckCircle } from 'lucide-react';
import './l.css';
// Create floating particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random positioning
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        
        // Random animation delay
        particle.style.animationDelay = Math.random() * 6 + 's';
        
        // Random size variation
        const size = Math.random() * 3 + 1;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        
        particlesContainer.appendChild(particle);
    }
}

// Security option selection functionality
function initializeSecurityOptions() {
    document.querySelectorAll('.security-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove active class from all options
            document.querySelectorAll('.security-option').forEach(opt => {
                opt.classList.remove('active');
            });
            
            // Add active class to clicked option
            this.classList.add('active');
            
            // Add click animation
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 100);
        });
    });
}

// Form input animations
function initializeInputAnimations() {
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('focus', function() {
            this.parentElement.style.transform = 'scale(1.02)';
        });
        
        input.addEventListener('blur', function() {
            this.parentElement.style.transform = 'scale(1)';
        });
    });
}

// Login button interaction
function initializeLoginButton() {
    document.querySelector('.login-btn').addEventListener('click', function(e) {
        e.preventDefault();
        
        // Visual feedback
        this.style.background = 'linear-gradient(135deg, #1e40af, #7c3aed)';
        this.innerHTML = 'Authenticating...';
        
        // Simulate authentication process
        setTimeout(() => {
            this.innerHTML = 'Access Granted ✓';
            this.style.background = 'linear-gradient(135deg, #059669, #047857)';
            
            setTimeout(() => {
                this.innerHTML = 'Access TraceLens Platform';
                this.style.background = 'linear-gradient(135deg, #3b82f6, #8b5cf6)';
            }, 2000);
        }, 1500);
    });
}

// Mouse move effect for 3D container tilt
function initializeMouseEffects() {
    document.addEventListener('mousemove', function(e) {
        const container = document.querySelector('.login-container');
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const deltaX = (x - centerX) / centerX;
        const deltaY = (y - centerY) / centerY;
        
        container.style.transform = `perspective(1000px) rotateY(${deltaX * 5}deg) rotateX(${-deltaY * 5}deg)`;
    });

    // Reset transform when mouse leaves
    document.querySelector('.login-container').addEventListener('mouseleave', function() {
        this.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
    });
}

// Form validation
function initializeFormValidation() {
    const form = document.getElementById('loginForm');
    const inputs = form.querySelectorAll('.form-input');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            validateInput(this);
        });
    });
}

// Individual input validation
function validateInput(input) {
    const value = input.value.trim();
    const inputWrapper = input.parentElement;
    
    // Remove existing validation classes
    inputWrapper.classList.remove('valid', 'invalid');
    
    if (input.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && emailRegex.test(value)) {
            inputWrapper.classList.add('valid');
        } else if (value) {
            inputWrapper.classList.add('invalid');
        }
    } else if (input.type === 'password') {
        if (value.length >= 6) {
            inputWrapper.classList.add('valid');
        } else if (value.length > 0) {
            inputWrapper.classList.add('invalid');
        }
    }
}

// Dynamic particle generation based on user interaction
function addInteractiveParticles(x, y) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.background = 'rgba(59, 130, 246, 0.8)';
    particle.style.animation = 'float 2s ease-out forwards';
    
    document.getElementById('particles').appendChild(particle);
    
    setTimeout(() => {
        particle.remove();
    }, 2000);
}

// Enhanced click effects
function initializeClickEffects() {
    document.addEventListener('click', function(e) {
        // Add particle effect at click position
        addInteractiveParticles(e.clientX, e.clientY);
        
        // Ripple effect for buttons
        if (e.target.classList.contains('security-option') || 
            e.target.classList.contains('login-btn')) {
            createRippleEffect(e);
        }
    });
}

// Ripple effect function
function createRippleEffect(e) {
    const button = e.target;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    const ripple = document.createElement('span');
    ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        pointer-events: none;
    `;
    
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 600);
}

// Add CSS for ripple animation
function addRippleCSS() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .input-wrapper.valid {
            border-color: #10b981 !important;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
        }
        
        .input-wrapper.invalid {
            border-color: #ef4444 !important;
            box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
        }
    `;
    document.head.appendChild(style);
}

// Keyboard accessibility
function initializeKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.target.classList.contains('security-option')) {
            e.target.click();
        }
        
        // Tab navigation enhancement
        if (e.key === 'Tab') {
            const focusableElements = document.querySelectorAll(
                'input, button, .security-option, a'
            );
            
            focusableElements.forEach(el => {
                el.addEventListener('focus', function() {
                    this.style.outline = '2px solid #3b82f6';
                    this.style.outlineOffset = '2px';
                });
                
                el.addEventListener('blur', function() {
                    this.style.outline = 'none';
                });
            });
        }
    });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Core functionality
    createParticles();
    initializeSecurityOptions();
    initializeInputAnimations();
    initializeLoginButton();
    initializeMouseEffects();
    
    // Enhanced features
    initializeFormValidation();
    initializeClickEffects();
    initializeKeyboardNavigation();
    addRippleCSS();
    
    // Console welcome message
    console.log('%c🔍 TraceLens OSINT Platform', 'color: #3b82f6; font-size: 18px; font-weight: bold;');
    console.log('%cसत्य देखें, स्रोत पहचानें।', 'color: #8b5cf6; font-size: 14px;');
    console.log('%cAdvanced cybersecurity and journalism verification system loaded.', 'color: #10b981; font-size: 12px;');
});