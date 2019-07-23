import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

// const my_index = new gcp.firestore.Index("my-index", {
//     collection: "chatrooms",
//     fields: [
//         {
//             fieldPath: "name",
//             order: "ASCENDING",
//         },
//         {
//             fieldPath: "description",
//             order: "DESCENDING",
//         },
//         {
//             fieldPath: "__name__",
//             order: "DESCENDING",
//         },
//     ],
//     project: "my-project-name",
// });