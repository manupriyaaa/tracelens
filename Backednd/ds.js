const axios = require('axios');

// Replace this with the actual path to your dataset file
const fileUrl = 'https://huggingface.co/datasets/masatoran/MLOps-face-pictures/resolve/main/data.json';

// Optional: Hugging Face token if private dataset
const HF_TOKEN = 'your_huggingface_token'; // If needed

async function downloadDataset() {
  try {
    const response = await axios.get(fileUrl, {
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`, // Remove this line if dataset is public
      },
    });

    console.log("Dataset loaded:");
    console.log(response.data);
  } catch (error) {
    console.error("Failed to load dataset:", error.message);
  }
}

downloadDataset();
