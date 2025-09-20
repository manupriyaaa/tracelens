// Import the client library
const vision = require('@google-cloud/vision');

// Creates a client
const client = new vision.ImageAnnotatorClient();

async function quickstart() {
  // The name of the image file to annotate
  const fileName = 'test.jpg'; // make sure test.jpg is in the same folder

  // Performs label detection on the image file
  const [result] = await client.labelDetection(fileName);
  const labels = result.labelAnnotations;
  console.log('Labels:');
  labels.forEach(label => console.log(label.description));
}

quickstart();