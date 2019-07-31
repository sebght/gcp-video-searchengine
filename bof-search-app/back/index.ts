import * as gcp from "@pulumi/gcp";
import { asset } from "@pulumi/pulumi";

const functionhwName = "helloGet"
const functionsuName = "getSignedURL"
const functionufName = "updateFirestore"
const functiontnbName = "triggerNewBof"
const topicNewBof = "NEW_BOF"
const bucketName = "sega"
const regionName = "us-central1"

const bucket = new gcp.storage.Bucket(`${bucketName}_bofsearch`,{
  name: `${bucketName}_bofsearch`,
  location: regionName
});

// Hello World

const bucketObjecthw = new gcp.storage.BucketObject("hw-zip", {
  bucket: bucket.name,
  source: new asset.AssetArchive({
      ".": new asset.FileArchive("./hw-func"),
  }),
});

const functionhw = new gcp.cloudfunctions.Function(functionhwName, {
  sourceArchiveBucket: bucket.name,
  runtime: "nodejs10",
  sourceArchiveObject: bucketObjecthw.name,
  entryPoint: "helloGet",
  triggerHttp: true,
  name: functionhwName
});

// Fonction qui renvoie une Signed URL au client

const bucketObjectUploadBof = new gcp.storage.BucketObject("ub-zip", {
  bucket: bucket.name,
  source: new asset.AssetArchive({
      ".": new asset.FileArchive("./upload-bof"),
  }),
});

const functionSignedURL = new gcp.cloudfunctions.Function(functionsuName, {
  sourceArchiveBucket: bucket.name,
  runtime: "nodejs10",
  sourceArchiveObject: bucketObjectUploadBof.name,
  entryPoint: "getSignedUrl",
  triggerHttp: true,
  name: functionsuName
});

const functionUpFirestore = new gcp.cloudfunctions.Function(functionufName, {
  sourceArchiveBucket: bucket.name,
  runtime: "nodejs10",
  sourceArchiveObject: bucketObjectUploadBof.name,
  entryPoint: "updateFirestore",
  triggerHttp: true,
  name: functionufName,
  environmentVariables: {
    topic: topicNewBof
  }
});

const triggerBof = new gcp.cloudfunctions.Function(functiontnbName, {
  sourceArchiveBucket: bucket.name,
  runtime: "nodejs10",
  sourceArchiveObject: bucketObjectUploadBof.name,
  entryPoint: "triggerNewBof",
  eventTrigger: {
    eventType: "providers/cloud.pubsub/eventTypes/topic.publish",
    resource: topicNewBof
  },
  environmentVariables: {
    bucket: "audio-source-bof"
  },
  name: functiontnbName
});

export let helloGetEndpoint = functionhw.httpsTriggerUrl;
export let SignedPostEndpoint = functionSignedURL.httpsTriggerUrl;
export let updateFirestoreEndpoint = functionUpFirestore.httpsTriggerUrl;
