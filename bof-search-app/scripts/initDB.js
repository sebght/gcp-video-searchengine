const Firestore = require('@google-cloud/firestore');
const db = new Firestore();
const content = require("./bofSamples.json");

for(const bofKey in content) {
    console.log(bofKey+": "+content[bofKey].name);
    let docRef = db.collection("bofs").doc();
    let setDoc = docRef.set({
        id: docRef.id,
        name: content[bofKey].name,
        description: content[bofKey].description,
        speaker: content[bofKey].speaker,
        thumbnailUrl: content[bofKey].thumbnailUrl,
        videoUrl: content[bofKey].videoUrl,
        audio_tags: content[bofKey].audio_tags,
        slides_tags: content[bofKey].slides_tags
    });
}