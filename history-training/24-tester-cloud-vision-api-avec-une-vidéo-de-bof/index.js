// Imports the Google Cloud client libraries
const vision = require('@google-cloud/vision');

// Creates a client
const client = new vision.ImageAnnotatorClient();

const bucketName = 'empty-for-test';
const fileName = 'slide1-git.jpg';

async function main(){
    // Performs text detection on the gcs file
    const [result] = await client.textDetection(`gs://${bucketName}/${fileName}`);
    console.log([result]);
    const detections = result.textAnnotations;
    console.log('Text:');
    detections.forEach(text => console.log(text));
}
async function detectFulltextGCS() {
    // Read a remote image as a text document
    const [result] = await client.documentTextDetection(`gs://${bucketName}/${fileName}`);
    const fullTextAnnotation = result.fullTextAnnotation;
    console.log(fullTextAnnotation.text);
}
  
main().catch(console.error);
// detectFulltextGCS().catch(console.error);