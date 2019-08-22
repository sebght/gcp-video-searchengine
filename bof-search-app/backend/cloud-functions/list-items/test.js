const Firestore = require('@google-cloud/firestore');
const db = new Firestore();

async function main() {
    let bofsRef = db.collection('bofs');
    let allBofs = await bofsRef.get();
    // allBofs.forEach(doc => {
    //         console.log(doc.id, '=>', Object.keys(doc.data()));
    //     });
    allBofs.forEach(doc => {
        console.log(doc.id, '=>', doc.data().name);
    });
}

main().catch();