const got = require('got');
const path = require('path');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const nl = require('@google-cloud/language');
const client_nl = new nl.LanguageServiceClient();
const speech = require('@google-cloud/speech');

const config = require('./config.json');

'use strict';
const projectId = "stage-bof-search";
const region = 'us-central1';
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
  } else if (!new RegExp(/\.(wav|mp3)/g).test(file.name)) {
    // Ignore changes to non-audio files
    return true;
  }

  console.log(`Analyzing gs://${file.bucket}/${file.name}`);

  const bucket = storage.bucket(file.bucket);
  const audio = {
    uri: 'gs://${file.bucket}/${file.name}'
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

  const client_speech = new speech.SpeechClient({
    projectId: 'stage-bof-search',
    keyFilename: './stage-bof-search-6df2ee0cb3b0.json'
  });

  // const client_speech = new speech.SpeechClient();

  return client_speech.recognize(request)
    .then(([transcription]) => {
      const filename = `analysis.json`;
      console.log(`Saving gs://${file.bucket}/${filename}`);

      return bucket
        .file(filename)
        .save(JSON.stringify(transcription, null, 2));
  });

  // // Transcribe the audio file
  // return client_speech.recognize(request)
  //   // Perform Sentiment, Entity, and Syntax analysis on the transcription
  //   .then(([transcription]) => client_nl.annotate(transcription))
  //   // Finally, save the analysis
  //   .then(([shortResponse, fullResponse]) => {
  //     const filename = `analysis.json`;
  //     console.log(`Saving gs://${file.bucket}/${filename}`);

  //     return bucket
  //       .file(filename)
  //       .save(JSON.stringify(fullResponse, null, 2));
  // });
}

