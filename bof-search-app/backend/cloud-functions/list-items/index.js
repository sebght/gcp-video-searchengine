const Firestore = require('@google-cloud/firestore');
const db = new Firestore();
const algoliasearch = require('algoliasearch');

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

/**
 * Firestore function that reports the Firestore changes into Algolia
 *
 * @param {object} data The event payload.
 * @param {object} context The event metadata.
 */
exports.reportsToAlgolia = async (data, context) => {
    const client = algoliasearch(process.env.algoliaID, process.env.algoliaAPIkey);
    const indexName = 'bofs-index';
    const index = client.initIndex(indexName);

    console.log(`Function triggered by change to: ${context.resource}`);
    console.log(`Event type: ${context.eventType}`);

    let bofsRef = db.collection('bofs');
    let algoliaRecords = [];
    let allBofs = await bofsRef.get();
    allBofs.forEach(doc => {
        const record = {
            id: doc.id,
            name: doc.name,
            description: doc.description,
            thumbnailUrl: doc.thumbnailUrl,
            speaker_name: doc.speaker[0].name,
            speaker_photo: doc.speaker[0].photo,
            videoUrl: doc.videoUrl,
            audio_tags: doc.audio_tags,
            slides_tags: doc.slides_tags,
            post_date_timestamp: doc.post_date_timestamp
        };
        algoliaRecords.push(record);
    });

    index.clearIndex();

    index.addObjects(algoliaRecords, (err, content) => {
        console.log("Index changed");
    });
};

