const {Storage} = require('@google-cloud/storage');
// import { Storage } from "@google-cloud/storage";

const storage = new Storage();
const Firestore = require('@google-cloud/firestore');
const db = new Firestore();
const admin = require('firebase-admin');

/**
 * HTTP function that generates a signed URL
 * The signed URL can be used to upload files to Google Cloud Storage (GCS)
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.getSignedUrl = (req, res) => {
  // Set CORS headers for preflight requests
  // Allows GETs from any origin with the Content-Type header
  // and caches preflight response for 3600s

  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    console.log(`Responding to an OPTIONS request`);
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  } else if (req.method !== "POST") {
    // Return a "method not allowed" error
    return res.status(405).end();
  }

  // TODO(developer) check that the user is authorized to upload
  console.log(`Getting a reference for the destination file`);
  // Get a reference to the destination file in GCS
  const file = storage.bucket(process.env.bucket).file(req.body.filename);

  // Create a temporary upload URL
  const expiresAtMs = Date.now() + 300000; // Link expires in 5 minutes
  const config = {
    action: "write",
    expires: expiresAtMs,
    contentType: req.body.contentType
  };

  console.log(`Trying to get a signed URL for uploading ${req.body.filename} in ${process.env.bucket}`);
  file.getSignedUrl(config, (err, url) => {
    if (err) {
      console.log(`There was an error while getting it`);
      console.error(err);
      res.status(500).end();
      return;
    }
    console.log(`Signed url is provided`);
    res.send(url);
  });
};

/**
 * HTTP function that reports a new upload to Firestore
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.createNewBof = async (req, res) => {
  // Set CORS headers for preflight requests
  // Allows GETs from any origin with the Content-Type header
  // and caches preflight response for 3600s
  res.set("Access-Control-Allow-Origin", "*");

  if (req.method === "OPTIONS") {
    console.log(`Responding to a pre-flight OPTIONS request`);
    // Send response to OPTIONS requests
    res.set("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Max-Age", "3600");
    return res.status(204).send("");
  } else if (req.method !== "POST") {
    // Return a "method not allowed" error
    return res.status(405).end();
  }

  console.log(`Responding to a POST request`);
  let docRef = db.collection("bofs").doc();
  console.log(`Created a new document with id : ${docRef.id}`);
  let setDoc = docRef.set({
    name: req.body.title,
    description: req.body.descr,
    files: [],
    tags: []
  });
  const bucket_input = storage.bucket(process.env.bucket_input);
  const bucket_output = storage.bucket(process.env.bucket_output);
  const pathFile = `${docRef.id}/init.json`;
  console.log(`Creating gs://${bucket_input.name}/${pathFile}`);
  const result_input = await bucket_input.file(pathFile).save(JSON.stringify(docRef.id, null));
  console.log(`Creating gs://${bucket_output.name}/${pathFile}`);
  const result_output = await bucket_output.file(pathFile).save(JSON.stringify(docRef.id, null));
  res.send(docRef.id);
  return [result_input,result_output];
};

/**
 * Background Cloud Function to be triggered by Cloud Storage.
 * This function reports any file added to the BoF source bucket into Firestore.
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.reportsFileUploads = (data,context) => {
  const file = data;
  if (file.resourceState === 'not_exists') {
    console.log(`File ${file.name} deleted.`);
  } else if (file.metageneration === '1') {
    // metageneration attribute is updated on metadata changes.
    // on create value is 1
    console.log(`File ${file.name} uploaded.`);

    const docId = file.name.split('/')[0];
    let docRef = db.collection("bofs").doc(docId);
    let setDoc = docRef.update({
      files: admin.firestore.FieldValue.arrayUnion({
        kind: file.contentType,
        filename: file.name
      })
    });
  } else {
    console.log(`File ${file.name} metadata updated.`);
  }
};
