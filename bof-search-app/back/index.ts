import * as gcp from "@pulumi/gcp";
import { asset } from "@pulumi/pulumi";

const functionhwName = "helloGet";
const functionsuName = "getSignedURL";
const functionnbName = "createBof";
const functionfuName = "reportsFileUploads";
const bucketName = "sega";
const regionName = "us-central1";
const source_bucket = "audio-source-bof";

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
  name: functionsuName,
  environmentVariables: {
    bucket: source_bucket
  }
});

const functionCreateBof = new gcp.cloudfunctions.Function(functionnbName, {
  sourceArchiveBucket: bucket.name,
  runtime: "nodejs8",
  sourceArchiveObject: bucketObjectUploadBof.name,
  entryPoint: "createNewBof",
  triggerHttp: true,
  name: functionnbName,
  environmentVariables: {
    bucket: source_bucket
  }
});

const functionFileUploads = new gcp.cloudfunctions.Function(functionfuName, {
  sourceArchiveBucket: bucket.name,
  runtime: "nodejs10",
  sourceArchiveObject: bucketObjectUploadBof.name,
  entryPoint: "reportsFileUploads",
  eventTrigger: {
    eventType: "providers/cloud.storage/eventTypes/object.finalize",
    resource: source_bucket
  },
  name: functionfuName
});

export let helloGetEndpoint = functionhw.httpsTriggerUrl;
export let SignedPostEndpoint = functionSignedURL.httpsTriggerUrl;
export let createBofEndpoint = functionCreateBof.httpsTriggerUrl;
