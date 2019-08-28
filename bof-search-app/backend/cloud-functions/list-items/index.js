const Firestore = require('@google-cloud/firestore');
const db = new Firestore();

/**
 * HTTP function that returns the list of all Bofs uploaded
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
exports.getAllBofs = async (req, res) => {
    res.set("Access-Control-Allow-Origin", "*");

    if (req.method === "OPTIONS") {
        console.log(`Responding to an OPTIONS request`);
        // Send response to OPTIONS requests
        res.set("Access-Control-Allow-Methods", "GET");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.set("Access-Control-Max-Age", "3600");
        return res.status(204).send("");
    } else if (req.method !== "GET") {
        // Return a "method not allowed" error
        return res.status(405).end();
    }

    // TODO(developer) check that the user is authorized to upload
    let bofsRef = db.collection('bofs');
    let videos = [];
    let allBofs = await bofsRef.get();
    allBofs.forEach(doc => {
        videos.push(doc.data());
    });
    res.send(videos)
};

