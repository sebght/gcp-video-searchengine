// Imports the Google Cloud client libraries
const vision = require('@google-cloud/vision');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();


// Creates a client
const client = new vision.ImageAnnotatorClient();

const bucketName = 'empty-for-test';
const fileName = 'slide1-git.jpg';

async function main(){
    // Performs text detection on the gcs file
    const [result] = await client.textDetection(`gs://${bucketName}/${fileName}`);
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

/**
 * Background Cloud Function to be triggered by Cloud Storage.
 * Transcripts the text found in the image.
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */

exports.analyzeSlide = (data, context) => {
    const file = data
    if (file.resourceState === 'not_exists') {
        console.log(`File ${file.name} deleted.`);
        return true;
    } else if (file.metageneration === '1') {
        // metageneration attribute is updated on metadata changes.
        // on create value is 1
        console.log(`File ${file.name} uploaded.`);
    } else {
        console.log(`File ${file.name} metadata updated.`);
    }
    if (!new RegExp(/\.(jpg|png)/g).test(file.name)) {
    // Ignore changes to non-image files
    console.log(`File ${file.name} is not an image file that is supported here`);
    return true;
    }

    const image_uri = `gs://${file.bucket}/${file.name}`

    console.log('Analyzing ' + image_uri);

    const bucket = storage.bucket(file.bucket);
    // Read a remote image as a text document
    client.documentTextDetection(image_uri)
        .then(([result]) => {
            const filename = `analysis/${file.name.split('.').slice(0, -1).join('.')}.json`;
            const fullTextAnnotation = result.fullTextAnnotation;
            console.log(`Saving gs://${file.bucket}/${filename}`);
            return bucket
                .file(filename)
                .save(JSON.stringify(fullTextAnnotation, null, 2));
        })
}
  
// main().catch(console.error);
// detectFulltextGCS().catch(console.error);