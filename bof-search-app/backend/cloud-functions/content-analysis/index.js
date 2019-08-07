const path = require('path');
const fs = require('fs');
const os = require('os');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
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
let languageCode;
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
    languageCode = 'fr-FR';

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
    const audioConfig = {
        encoding: encoding,
        sampleRateHertz: sampleRate,
        languageCode: languageCode
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

