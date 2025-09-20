import React, { useState } from "react"; 
import { User, Heart, Phone, Save, Send, Camera, CheckCircle } from 'lucide-react';
import './trace.css';
let generatedOTP = '';
let otpSentTime = null;

function generateOTP() {
    const mobileInput = document.getElementById('mobile');
    const otpBtn = document.getElementById('otpBtn');
    const otpSuccess = document.getElementById('otpSuccess');
    const mobileError = document.getElementById('mobileError');
    
    const mobile = mobileInput.value.trim();
    
    // Validate mobile number
    if (!/^\d{10}$/.test(mobile)) {
        mobileError.style.display = 'block';
        mobileError.textContent = 'Please enter a valid 10-digit mobile number';
        return;
    }
    
    mobileError.style.display = 'none';
    
    // Generate random 6-digit OTP
    generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
    otpSentTime = Date.now();
    
    // Update button state
    otpBtn.disabled = true;
    otpBtn.textContent = 'OTP Sent';
    otpBtn.style.background = '#7f8c8d';
    
    // Show success message
    otpSuccess.style.display = 'block';
    otpSuccess.textContent = `OTP sent to +91${mobile} | OTP: ${generatedOTP}`;
    
    // Re-enable button after 30 seconds
    setTimeout(() => {
        otpBtn.disabled = false;
        otpBtn.textContent = 'Resend OTP';
        otpBtn.style.background = '#27ae60';
    }, 30000);
    
    console.log('Generated OTP:', generatedOTP); // For testing purposes
}

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const enteredOTP = document.getElementById('otp').value.trim();
    
    // Clear previous error messages
    document.querySelectorAll('.error-message').forEach(msg => msg.style.display = 'none');
    
    let hasError = false;
    
    // Validate email
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
        document.getElementById('emailError').style.display = 'block';
        hasError = true;
    }
    
    // Validate password
    if (!password || password.length < 6) {
        document.getElementById('passwordError').style.display = 'block';
        document.getElementById('passwordError').textContent = 'Password must be at least 6 characters';
        hasError = true;
    }
    
    // Validate mobile
    if (!mobile || !/^\d{10}$/.test(mobile)) {
        document.getElementById('mobileError').style.display = 'block';
        hasError = true;
    }
    
    // Validate OTP
    if (!enteredOTP) {
        document.getElementById('otpError').style.display = 'block';
        hasError = true;
    } else if (!generatedOTP) {
        document.getElementById('otpError').style.display = 'block';
        document.getElementById('otpError').textContent = 'Please generate OTP first';
        hasError = true;
    } else if (enteredOTP !== generatedOTP) {
        document.getElementById('otpError').style.display = 'block';
        document.getElementById('otpError').textContent = 'Invalid OTP. Please check and try again';
        hasError = true;
    } else if (otpSentTime && (Date.now() - otpSentTime > 300000)) { // 5 minutes expiry
        document.getElementById('otpError').style.display = 'block';
        document.getElementById('otpError').textContent = 'OTP has expired. Please generate a new one';
        hasError = true;
    }
    
    if (hasError) {
        return;
    }
    
    // Simulate login process
    const loginBtn = document.getElementById('loginButton');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    setTimeout(() => {
        alert('Login successful! Welcome to Trace Lens Professional Platform');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
        
        // Reset form
        document.getElementById('loginForm').reset();
        generatedOTP = '';
        otpSentTime = null;
        document.getElementById('otpBtn').textContent = 'Send OTP';
        document.getElementById('otpBtn').style.background = '#27ae60';
        document.getElementById('otpSuccess').style.display = 'none';
    }, 2500);
});

// Real-time validation
document.getElementById('email').addEventListener('blur', function() {
    const email = this.value.trim();
    const errorMsg = document.getElementById('emailError');
    
    if (email && !/\S+@\S+\.\S+/.test(email)) {
        errorMsg.style.display = 'block';
        errorMsg.textContent = 'Please enter a valid email address';
    } else {
        errorMsg.style.display = 'none';
    }
});

document.getElementById('mobile').addEventListener('input', function() {
    // Only allow digits
    this.value = this.value.replace(/\D/g, '');
    
    const errorMsg = document.getElementById('mobileError');
    if (this.value.length === 10) {
        errorMsg.style.display = 'none';
    }
});

document.getElementById('otp').addEventListener('input', function() {
    // Only allow digits
    this.value = this.value.replace(/\D/g, '');
});