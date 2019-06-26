const got = require('got');
const path = require('path');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const nl = require('@google-cloud/language');
const client_nl = new nl.LanguageServiceClient();
const speech = require('@google-cloud/speech');

const config = require('./config.json');

'use strict';
const result_bucket = config.RESULTS_BUCKET;

/**
 * HTTP Cloud Function
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.helloGet = (req,res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.send("Hello World!");
};

/**
 * Background Cloud Function to be triggered by Cloud Storage.
 * Simply logs the trigger properties.
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.watchStorage = (data, context) => {
  const file = data;
  console.log(`  Event ${context.eventId}`);
  console.log(`  Event Type: ${context.eventType}`);
  console.log(`  Bucket: ${file.bucket}`);
  console.log(`  File: ${file.name}`);
  console.log(`  Metageneration: ${file.metageneration}`);
  console.log(`  Created: ${file.timeCreated}`);
  console.log(`  Updated: ${file.updated}`);
}

/**
 * Background Cloud Function to be triggered by Cloud Storage.
 * Transcripts the audio file uploaded.
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.getRecording = (data,context) => {
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
  if (!new RegExp(/\.(wav)/g).test(file.name)) {
    // Ignore changes to non-audio files
    console.log(`File ${file.name} is not a .wav file`);
    return true;
  }

  const audio_uri = `gs://${file.bucket}/${file.name}`

  console.log('Analyzing ' + audio_uri);

  const bucket = storage.bucket(file.bucket);
  const audio = {
    uri: audio_uri
  };

  // Configure audio settings for BoF recordings
  const audioConfig = {
    encoding: 'LINEAR16',
    sampleRateHertz: 44100,
    languageCode: 'fr-FR'
  };

  const request = {
    audio: audio,
    config: audioConfig,
  };

  const client_speech = new speech.SpeechClient();

  client_speech.recognize(request)
    .then(([response]) => {
      const filename = `analysis.json`;
      const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
      console.log(`Saving gs://${file.bucket}/${filename}`);
      return bucket
        .file(filename)
        .save(JSON.stringify(transcription, null, 2));
    });
}

