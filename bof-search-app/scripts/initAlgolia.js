const algoliasearch = require('algoliasearch');
const Firestore = require('@google-cloud/firestore');
const db = new Firestore();
const content = require("./bofSamples.json");

const client = algoliasearch(process.env.algoliaID, process.env.algoliaAPIkey);
const indexName = 'bofs-index';
const index = client.initIndex(indexName);

let algoliaRecords = [];

for (const bofKey in content) {
    console.log(bofKey+": "+content[bofKey].name);
    const record = {
        name: content[bofKey].name,
        description: content[bofKey].description,
        speaker: content[bofKey].speaker[0].name,
        audio_tags: content[bofKey].audio_tags,
        slides_tags: content[bofKey].slides_tags,
        post_date: content[bofKey].post_date,
        post_date_timestamp: content[bofKey].post_date_timestamp
    };
    algoliaRecords.push(record);
}

index.clearIndex();

index.addObjects(algoliaRecords, (err, content) => {
    console.log("Index initialisé");
});

index.setSettings({
    searchableAttributes: [
        'description',
        'name',
        'full_text_audio',
        'full_text_slides',
        'speaker'
    ],
    customRanking: [
        'desc(post_date_timestamp)'
    ],
    attributesForFaceting: [
        'searchable(audio_tags)',
        'searchable(slides_tags)'
    ]
});