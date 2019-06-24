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

exports.helloGet = (req,res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.send("Hello World!");
};

// exports.uploaderToGCS = (req,res) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');

//   const bucketName = result_bucket;
//   const filename = req.body.name;

//   // Uploads a local file to the bucket
//   await storage.bucket(bucketName).upload(filename, {
//     // Support for HTTP requests made with `Accept-Encoding: gzip`
//     gzip: true,
//     // By setting the option `destination`, you can change the name of the
//     // object you are uploading to a bucket.
//     metadata: {
//       // Enable long-lived HTTP caching headers
//       // Use only if the contents of the file will never change
//       // (If the contents will change, use cacheControl: 'no-cache')
//       cacheControl: 'public, max-age=31536000',
//     },
//   });
//   res.send(`${filename} uploaded to ${bucketName}.`);
// }

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

exports.getRecording = (data,context) => {
  const file = data;
  if (file.resourceState === 'not_exists') {
    // Ignore file deletions
    return true;
  } else if (!new RegExp(/\.(wav)/g).test(file.name)) {
    // Ignore changes to non-audio files
    console.log('Not a .wav file')
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

