const path = require('path');
const fs = require('fs');
const os = require('os');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const Firestore = require('@google-cloud/firestore');
const db = new Firestore();
const admin = require('firebase-admin');
const nl = require('@google-cloud/language');
const client_nl = new nl.LanguageServiceClient();
const speech = require('@google-cloud/speech');
const client_speech = new speech.SpeechClient();
const ffmpeg_static = require('ffmpeg-static');
const ffmpeg = require('fluent-ffmpeg');

// Makes an ffmpeg command return a promise.
function promisifyCommand(command) {
    return new Promise((resolve, reject) => {
        command.on('end', resolve).on('error', reject).run();
    });
}

// lazy initialisation of variables
let encoding;
let primaryLanguageCode;
let secondaryLanguageCode;
// used-by-everyone variable
const sampleRate = 44100 ;

'use strict';

/**
 * Background Cloud Function to be triggered by Cloud Storage.
 * Converts the audio to optimized format for transcription
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.convertAudioBof = async (data,context) => {
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
    if (!new RegExp(/\.(wav|mp3)/g).test(file.name)) {
        // Ignore changes to non-audio files
        console.log(`File ${file.name} is not a .wav nor a .mp3 file`);
        return true;
    }

    const source_bucket = storage.bucket(file.bucket);
    const output_bucket = storage.bucket(process.env.bucket_output);

    const fileName = path.basename(file.name);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const targetTempFileName = fileName.replace(/\.[^/.]+$/, "") + '_converted.wav';
    const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);
    const targetStorageFilePath = path.join(path.dirname(file.name), targetTempFileName);

    await source_bucket.file(file.name).download({destination: tempFilePath});
    console.log('Audio downloaded locally to', tempFilePath);

    let command = ffmpeg(tempFilePath)
        .setFfmpegPath(ffmpeg_static.path)
        .audioChannels(1)
        .audioFrequency(sampleRate)
        .format('wav')
        .output(targetTempFilePath);

    await promisifyCommand(command);
    console.log('Output audio created at', targetTempFileName);

    await output_bucket.upload(targetTempFilePath, {destination: targetStorageFilePath, resumable: false});
    console.log('Output audio uploaded to', targetStorageFilePath);

    // Once the audio has been uploaded delete the local file to free up disk space.
    fs.unlinkSync(tempFilePath);
    fs.unlinkSync(targetTempFilePath);

    return console.log('Temporary files removed.', tempFilePath, targetTempFilePath);
};

/**
 * Background Cloud Function to be triggered by Cloud Storage.
 * Transcripts the audio file uploaded.
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.speechToText = async (data,context) => {
    const file = data;
    encoding = 'LINEAR16';
    primaryLanguageCode = 'fr-FR';
    secondaryLanguageCode = 'en-US';

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
    if (!new RegExp(/\.(wav)/g).test(file.name)) {
        // Ignore changes to non-audio files
        console.log(`File ${file.name} is not a .wav file`);
        return true;
    }

    const audio_uri = `gs://${file.bucket}/${file.name}`

    console.log('Analyzing ' + audio_uri);

    const converted_bucket = storage.bucket(file.bucket);
    const output_bucket = storage.bucket(process.env.bucket_output);
    const audio = {
        uri: audio_uri
    };

    // Configure audio settings for BoF recordings
    const phrases = fs.readFileSync('tech_glossary.txt').toString().split("\n");
    const audioConfig = {
        encoding: encoding,
        sampleRateHertz: sampleRate,
        languageCode: primaryLanguageCode,
        alternativeLanguageCodes: [primaryLanguageCode, secondaryLanguageCode],
        speechContexts: [{
        "phrases": phrases,
        "boost": 20
        }]
    };

    const request = {
        audio: audio,
        config: audioConfig,
    };

    const [operation] = await client_speech.longRunningRecognize(request);
    // Get a Promise representation of the final result of the job
    const [response] = await operation.promise();
    const bofID = path.dirname(file.name);
    const filename = `${bofID}/analysis.txt`;
    const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
    console.log(`Saving gs://${process.env.bucket_output}/${filename}`);
    return output_bucket
        .file(filename)
        .save(transcription);
};

/**
 * Background Cloud Function to be triggered by Cloud Storage.
 * Transcripts the audio file uploaded.
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.getKeywordsAudio = async (data,context) => {
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
    if (path.basename(file.name) !== 'analysis.txt' ) {
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
    const min_mentions = 3;
    const myFilteredData = result_final.filter(function(obj) {
        return obj.salience > 0.01 && obj.mentions >= min_mentions;
    });

    const bofID = path.dirname(file.name);
    let docRef = db.collection("bofs").doc(bofID);
    console.log(`Reporting in Firestore : collection "bofs" doc "${bofID}"`);
    let setDoc = docRef.update({
        audio_tags: myFilteredData
    });

    const output_bucket = storage.bucket(file.bucket);
    const filename = `${bofID}/indexes.txt`;
    console.log(`Saving all non-filtered tags in gs://${file.bucket}/${filename}`);
    return output_bucket
        .file(filename)
        .save(JSON.stringify(result_final));

};

