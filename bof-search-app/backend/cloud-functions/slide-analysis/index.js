const path = require('path');
const fs = require('fs');
const os = require('os');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const vision = require('@google-cloud/vision');
const client_vision = new vision.ImageAnnotatorClient();

/**
 * Background Cloud Function to be triggered by Cloud Storage.
 * Transcripts the pdf file uploaded.
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.slidesToText = async (data,context) => {
    const file = data;
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
    if (!new RegExp(/\.(pdf)/g).test(file.name)) {
        // Ignore changes to non-pdf files
        console.log(`File ${file.name} is not a .pdf file`);
        return true;
    }

    const bofId = path.dirname(file.name);
    const gcsSourceUri = `gs://${file.bucket}/${file.name}`;
    const gcsDestinationUri = `gs://${process.env.bucket_output}/${bofId}/fullanalysis_from_slides.json`;

    const inputConfig = {
        mimeType: 'application/pdf',
        gcsSource: {
            uri: gcsSourceUri
        },
    };
    const outputConfig = {
        gcsDestination: {
            uri: gcsDestinationUri
        },
    };
    const features = [{type: 'DOCUMENT_TEXT_DETECTION'}];
    const request = {
        requests: [
            {
                inputConfig: inputConfig,
                features: features,
                outputConfig: outputConfig
            }
        ]
    };

    const [operation] = await client_vision.asyncBatchAnnotateFiles(request);
    const [filesResponse] = await operation.promise();
    const destinationUri =
        filesResponse.responses[0].outputConfig.gcsDestination.uri;
    console.log('Json saved to: ' + destinationUri);
};

/**
 * Background Cloud Function to be triggered by Cloud Storage.
 * Transcripts the pdf file uploaded.
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.slideAnalysisCleaning = async (data,context) => {
    const file = data;
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
    if (path.basename(file.name).split('.')[0] !== 'fullanalysis_from_slides' ) {
        // Ignore changes to other files
        console.log(`No cleaning is needed on ${file.name}`);
        return true;
    }

    const bucket = storage.bucket(file.bucket);

    const fileName = path.basename(file.name);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    await bucket.file(file.name).download({destination: tempFilePath});
    console.log('Audio downloaded locally to', tempFilePath);

    const content = require(tempFilePath);
    const responses = content.responses;
    const transcription = responses.map(response => response.fullTextAnnotation.text).join('');
    const bofId = path.dirname(file.name);
    const filename = `${bofId}/analysis_from_slides.txt`;
    return bucket.file(filename).save(transcription);

};
