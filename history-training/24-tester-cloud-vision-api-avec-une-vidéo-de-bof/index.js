// Imports the Google Cloud client libraries
const vision = require('@google-cloud/vision');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();


// Creates a client
const client = new vision.ImageAnnotatorClient();

const bucketName = 'empty-for-test';
const fileName = 'slide1-git.jpg';

async function detectTextGCS(){
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
async function batchAnnotateGCS() {
    // GCS path where the pdf file resides
    const gcsSourceUri = 'gs://my-bucket/my_pdf.pdf';

    const inputConfig = {
        // Supported mime_types are: 'application/pdf' and 'image/tiff'
        mimeType: 'application/pdf',
        gcsSource: {
        uri: gcsSourceUri,
        },
    };
    const features = [{type: 'DOCUMENT_TEXT_DETECTION'}];
    const request = {
        requests: [
        {
            inputConfig: inputConfig,
            features: features,
            // Annotate the first two pages and the last one (max 5 pages)
            // First page starts at 1, and not 0. Last page is -1.
            pages: [1, 2, -1],
        },
        ],
    };

    const [result] = await client.batchAnnotateFiles(request);
    const responses = result.responses[0].responses;

    for (const response of responses) {
        for (const page of response.fullTextAnnotation.pages) {
        for (const block of page.blocks) {
            console.log(`Block confidence: ${block.confidence}`);
            for (const paragraph of block.paragraphs) {
            console.log(` Paragraph confidence: ${paragraph.confidence}`);
            for (const word of paragraph.words) {
                const symbol_texts = word.symbols.map(symbol => symbol.text);
                const word_text = symbol_texts.join('');
                console.log(
                `  Word text: ${word_text} (confidence: ${word.confidence})`
                );
                for (const symbol of word.symbols) {
                console.log(
                    `   Symbol: ${symbol.text} (confidence: ${symbol.confidence})`
                );
                }
            }
            }
        }
        }
    }
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
  
// detectTextGCS().catch(console.error);
// detectFulltextGCS().catch(console.error);