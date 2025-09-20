// Install dependencies first (Node.js):
// npm install @vladmandic/face-api @huggingface/hub node-fetch

import * as faceapi from '@vladmandic/face-api';
import fetch from 'node-fetch';
import { HfApi } from '@huggingface/hub';
import fs from 'fs';

// ------------------------
// Step 1: Setup Hugging Face Hub API
// ------------------------
const api = new HfApi();

// If dataset is private, set your HF token here
const HF_TOKEN = "YOUR_HF_TOKEN"; 

// ------------------------
// Step 2: Download a sample image from dataset
// ------------------------
async function downloadSample() {
  const url = "https://huggingface.co/datasets/Nexdata/500605-Images-Individual-Photo-Face-Data/resolve/main/train/image_00001.jpg";
  const res = await fetch(url, { headers: { Authorization: `Bearer ${HF_TOKEN}` } });
  const buffer = await res.arrayBuffer();
  fs.writeFileSync("sample.jpg", Buffer.from(buffer));
  console.log("Sample image saved as sample.jpg");
}

// ------------------------
// Step 3: Load models for face-api.js
// ------------------------
async function loadModels() {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk('./models'); 
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./models');
  await faceapi.nets.faceRecognitionNet.loadFromDisk('./models');
}

// ------------------------
// Step 4: Detect faces
// ------------------------
async function detectFaces() {
  const img = await faceapi.bufferToImage(fs.readFileSync("sample.jpg"));
  const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();
  console.log("Detections:", detections);
}

// ------------------------
// Run pipeline
// ------------------------
(async () => {
  await downloadSample();
  await loadModels();
  await detectFaces();
})();
// Note: Ensure you have the models downloaded in a 'models' directory