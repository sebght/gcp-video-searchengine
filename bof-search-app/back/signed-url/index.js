const { Storage } = require("@google-cloud/storage");
const storage = new Storage();

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

  res.set('Access-Control-Allow-Origin', '*');

  if (req.method === 'OPTIONS') {
    console.log(`Responding to an OPTIONS request`)
    // Send response to OPTIONS requests
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  } else if (req.method !== 'POST') {
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
