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
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  if (req.method !== "POST") {
    // Return a "method not allowed" error
    return res.status(405).end();
  }
  // TODO(developer) check that the user is authorized to upload

  // Get a reference to the destination file in GCS

  const file = storage.bucket(req.body.bucket).file(req.body.filename);

  // Create a temporary upload URL
  const expiresAtMs = Date.now() + 300000; // Link expires in 5 minutes
  const config = {
    action: "write",
    expires: expiresAtMs,
    contentType: req.body.contentType
  };

  file.getSignedUrl(config, (err, url) => {
    if (err) {
      console.error(err);
      res.status(500).end();
      return;
    }
    res.send(url);
  });
};
