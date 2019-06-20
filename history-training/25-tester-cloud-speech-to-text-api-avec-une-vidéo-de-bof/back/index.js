const got = require('got');
const path = require('path');
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();
const nl = require('@google-cloud/language');
const client_nl = new nl.LanguageServiceClient();
const speech = require('@google-cloud/speech');

const config = require('./config.json');

'use strict';
const projectId = "bof-search";
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

  // const client_speech = new speech.SpeechClient({
  //   credentials: {
  //     client_email: 'gitlab-ci-admin@stage-bof-search.iam.gserviceaccount.com',
  //     private_key: '-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQD3iBW/a7Phpo0/\nMxryOq7mRDlY2651BrWEZfbgD+zOIajKvpFzEoJZKkMNiA/Km2cbegtBDaY79djG\nEsjCxFZbaGXQML8zyiGWYqSdDUeO3ps4cXGLYqrXha4oi+PQ5rh+NrkbFxqNcHHr\n3GQv5MdlBYHEgDf1v0VsipJ+0tBALJiv0UeGoQdnv6skiJX6u4qlTEsYkKIKGRLO\nahV7SgqlF4XWeDSkNshhXEo+k/AFZ81c9oWLLOROZMl96Bd4bMRZ4oEnXan7ztQc\nUZpkPYvgNxywNVpi9Fy0u5CZ5ueFXv0jR/AhjrnD1YGAWttxenG7x1+lD96wVNOe\nIkh3Sbv1AgMBAAECgf8DV70t9dirOsBzC2mE8dg3m55PNczU3bAK3ym/dneXoX2m\nDBFYfHnJ0Gk0qFFFIgdRDogRD7BphUd+FNF8q0dastO0eGHE3D8UNonz7MT0rJ8x\ne7XLADJVvhICa4ltipomaqVlv5JaZUBJKaIiGWKJUnsWX3GyeXxglHcrecqX/UvY\nJMXATpI7w0RpYo85Z9yAKq/Qr9ah/ZN+x3xBsHuh+EdJLdtStLz2a6vXc+zRQoBk\neKJEe+/f6RhX77KAtqbvhEtadNsxiZWzR9XtZHvysJLT4wywzWT/NaIgKcbuR2X5\n1nzf+FSk6nuAymjH2K1Yvd7ENI5HpdPiXU6kZoUCgYEA/0nFfJdLLfljlVLp6h1t\nyYk2PU+zAYUWljvpwUDY+RmxOROF9WlzX6CcOjDBoBPYCSv44e7PhDt4yeSZrx2Z\n6qtA10A8x2KxsrVqCKKD50eDs4AitdZRTkvirCel/WysXhhI2pF0GJAS14ds0EJN\nyZqkqrhmJvME7wZr/VUsw6sCgYEA+DjG2RGnwle+ajmnKAG7yAsyfSOtOpGtMoTg\n+LcFadOoHlLH8/WWrbk6YjEQBOxWS/WnD9D7t8Ee5nDl1Zdh0+5K0SPk79K09ErK\ndap7b+BzZtb3w9T1nDfjWWGWZk/K6UOOdwAvYK0jElkSJrJ0iwZalaV8s4xjburO\nM13X3t8CgYB19VZlLVs1kQhslPU0kgiKmPYQ+mSSDTbUkDaAb0BSSYbUAqthLCp9\nQy8szB6Lot+tzT2g18HXLcuwLgq9GYZnIl5Bl5L95iKJmr2147HjCe5W4JwpPTAw\nZ2wDdAaExNQYXkw7gf4M43VxVUf4KsranrP7llzNHnlnIKaBVfvrJQKBgQDCDoFH\nCwqAYWC4Y0JPgKtyBW7/bnjrpSAmssO/LjbJOXPh4Q35qDKYtoryYTEI6Eu/Ltng\n/50LV6v0tKa6iZMtwMo1Hz7IT46wvhfyTcoa+Pq/l6g0LbWm3/qZ0jVm31LfcrVa\nS4a+qh0VJxWNs05xshH3lF0dcc/60w9KET/HOQKBgFqj8BAwb10zy3oc5hEFSFIU\nSJ0+pGy0NjCdhqs0Oit3gfc392wGWvS8/NWMbmhY7hOnOQ2SiT3V9eJKQlct7w/L\ni/lOmvEZ513iiVMfPBBc4ftyCKlgnfQvBlPvo/5P39exUnxUEGH05ksTO5BMcN21\nnPcXf/KzDqB+y/jKxY9n\n-----END PRIVATE KEY-----\n'
  //   }
  // });

  const client_speech = new speech.SpeechClient();

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

