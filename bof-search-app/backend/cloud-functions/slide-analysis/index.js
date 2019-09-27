const path = require('path');
const fs = require('fs');
const os = require('os');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const vision = require('@google-cloud/vision');
const client_vision = new vision.ImageAnnotatorClient();
const nl = require('@google-cloud/language');
const client_nl = new nl.LanguageServiceClient();
const Firestore = require('@google-cloud/firestore');
const db = new Firestore();

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

/**
 * Background Cloud Function to be triggered by Cloud Storage.
 * Transcripts the audio file uploaded.
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.getKeywordsSlides = async (data,context) => {
    const file = data;
    primaryLanguageCode = 'fr';

    if (file.resourceState === 'not_exists') {
        console.log(`File ${file.name} deleted.`);
        return true;
    } else if (file.metageneration === '1') {
        // metageneration attribute is updated on metadata changes.
        // on create value is 1
        console.log(`File ${file.name} uploaded.`);
    } else {
        console.log(`File ${file.name} metadata updated.`);
        return true;
    }
    if (path.basename(file.name) !== 'analysis_from_slides.txt' ) {
        // Ignore changes to non-audio files
        console.log(`File ${file.name} is already processed by Natural Language`);
        return true;
    }
    const document = {
        gcsContentUri: `gs://${file.bucket}/${file.name}`,
        type: 'PLAIN_TEXT',
        language: primaryLanguageCode
    };

    // Detects entities in the document
    const [result] = await client_nl.analyzeEntities({document});
    const entities = result.entities;

    const bofID = path.dirname(file.name);
    const output_bucket = storage.bucket(file.bucket);
    await output_bucket.file(`${bofID}/full_indexes_from_slides.txt`).save(JSON.stringify(entities));

    var result_final = [];
    entities.reduce(function(res, value) {
        if (!res[value.name]) {
            res[value.name] = { name: value.name, salience: 0, count: 0, mean_salience: 0, mentions: 0 };
            result_final.push(res[value.name]);
        }
        res[value.name].mentions += value.mentions.length;
        res[value.name].count += 1;
        res[value.name].salience += value.salience;
        res[value.name].mean_salience = Number((res[value.name].salience / res[value.name].count).toFixed(2));
        return res;
    }, {});
    const myFilteredData = result_final.filter(function(obj) {
        return obj.salience > 0.04 && obj.name.split(' ').length === 1;
    });

    let docRef = db.collection("bofs").doc(bofID);
    console.log(`Reporting in Firestore : collection "bofs" doc "${bofID}"`);
    let setDoc = docRef.update({
        slides_tags: myFilteredData
    });

    const client = algoliasearch(process.env.algoliaID, process.env.algoliaAPIkey);
    const indexName = 'bofs-index';
    const index = client.initIndex(indexName);

    index.partialUpdateObject({
        slides_tags: myFilteredData,
        id: bofID
    }, (err, content) => {
        if (err) throw err;
    });

    const filename = `${bofID}/indexes_from_slides.txt`;
    console.log(`Saving all non-filtered tags in gs://${file.bucket}/${filename}`);
    return output_bucket
        .file(filename)
        .save(JSON.stringify(result_final));

};
