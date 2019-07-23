const Firestore = require('@google-cloud/firestore');

const db = new Firestore({
  projectId: 'bof-search',
  keyFilename: '/Users/sebastien.gahat/.gcloud/bof-search-pulumi.json',
});

// // Copy Paste of the quickstart
// let docRef = db.collection('users').doc('alovelace');

// let setAda = docRef.set({
//     first: 'Ada',
//     last: 'Lovelace',
//     born: 1815
//   });

//  // Setup d'une sous collection dans le document 'test_hw', dans la collection 'test_hw'
// let docRef = db.collection('test_hw').doc('test_hw');
// let setAda = docRef.set({
//     name: "hello-world",
//     description: "Hello World",
//     items: [
//         { name: "first item", value: 8 },
//         { name: "second item", value: 18 },
//     ]
//   });

// Same than before but the document id will be setup randomly
let docRef = db.collection('test_hw2').add({
    name: "hello-world",
    description: "Hello World",
    items: [
        { name: "first item", value: 8 },
        { name: "second item", value: 18 },
    ]
}).then(ref => {
    console.log('Added document with ID: ', ref.id);
});