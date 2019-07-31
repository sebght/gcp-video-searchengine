const { Storage } = require("@google-cloud/storage");
const storage = new Storage();
const Firestore = require('@google-cloud/firestore');
const db = new Firestore();
const {PubSub} = require('@google-cloud/pubsub');
const pubsub = new PubSub();

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
  const file = storage.bucket(req.body.bucket).file(req.body.filename);

  // Create a temporary upload URL
  const expiresAtMs = Date.now() + 300000; // Link expires in 5 minutes
  const config = {
    action: "write",
    expires: expiresAtMs,
    contentType: req.body.contentType
  };

  console.log(`Trying to get a Signed URL for uploading ${req.body.filename} in ${req.body.bucket}`);
  file.getSignedUrl(config, (err, url) => {
    if (err) {
      console.log(`There was an error`);
      console.error(err);
      res.status(500).end();
      return;
    }
    console.log(`No error`);
    res.send(url);
  });
};

/**
 * HTTP function that reports a new upload to Firestore
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.updateFirestore = (req, res) => {
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
    files: req.body.files.map(file => ({
      kind: file.filetype,
      filename: file.filename
    }))
  })
  const topicName = process.env.topic;
  const data = {
    folder: docRef.id
  };
  const dataBuffer = Buffer.from(JSON.stringify(data));
  res.send(docRef.id);
  return pubsub.topic(topicName).get({autoCreate: true}).then(([topic]) => topic.publish(dataBuffer));
};

/**
 * Background Cloud Function to be triggered by Pub/Sub.
 * This function is exported by index.js, and executed when
 * the trigger topic receives a message.
 *
 * @param {object} pubSubEvent The event payload.
 * @param {object} context The event metadata.
 */
exports.triggerNewBof = (event,context) => {
  const pubsubData = event.data;
  const jsonStr = Buffer.from(pubsubData, 'base64').toString();
  const payload = JSON.parse(jsonStr);

  const bucket = storage.bucket(process.env.bucket);
  const pathFile = `${payload.folder}/init.json`;
  console.log(`Creating gs://${pathFile}`);
  return bucket.file(pathFile).save(JSON.stringify(payload.folder, null))
};
