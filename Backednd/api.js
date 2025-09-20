const vision = require('@google-cloud/vision');

// Creates a client
const client = new vision.ImageAnnotatorClient();

async function detectFaces() {
  // Replace with your image path
  const fileName = './test.jpg';

  // Performs face detection on the local file
  const [result] = await client.faceDetection(fileName);
  const faces = result.faceAnnotations;
  console.log('Faces:');
  faces.forEach((face, i) => {
    console.log(`Face #${i + 1}:`);
    console.log(`  Joy: ${face.joyLikelihood}`);
    console.log(`  Anger: ${face.angerLikelihood}`);
    console.log(`  Sorrow: ${face.sorrowLikelihood}`);
    console.log(`  Surprise: ${face.surpriseLikelihood}`);
  });
}

detectFaces();
