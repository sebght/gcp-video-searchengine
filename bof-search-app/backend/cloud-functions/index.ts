import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const stackConfig = new pulumi.Config("resources");
const config = {
  sourceBucketName: stackConfig.require("sourceBucketName"),
  region: stackConfig.require("region"),
  functionsBucketName: stackConfig.require("functionsBucketName")
};

const functionhwName = "helloGet";
const functionsuName = "getSignedURL";
const functionnbName = "createBof";
const functionfuName = "reportsFileUploads";
const bucketName = config.functionsBucketName;
const regionName = config.region;
const source_bucket = config.sourceBucketName;

const bucket = new gcp.storage.Bucket(`${bucketName}_bofsearch`,{
  name: `${bucketName}_bofsearch`,
  location: regionName
});

// Hello World

const bucketObjecthw = new gcp.storage.BucketObject("hw-zip", {
  bucket: bucket.name,
  source: new pulumi.asset.AssetArchive({
      ".": new pulumi.asset.FileArchive("./backend/cloud-functions/hw-func"),
  }),
});

const functionhw = new gcp.cloudfunctions.Function(functionhwName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
  runtime: "nodejs10",
  sourceArchiveObject: bucketObjecthw.name,
  entryPoint: "helloGet",
  triggerHttp: true,
  name: functionhwName
});

// Fonction qui renvoie une Signed URL au client

const bucketObjectUploadBof = new gcp.storage.BucketObject("ub-zip", {
  bucket: bucket.name,
  source: new pulumi.asset.AssetArchive({
      ".": new pulumi.asset.FileArchive("./backend/cloud-functions/upload-bof"),
  }),
});

const functionSignedURL = new gcp.cloudfunctions.Function(functionsuName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
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
  region: regionName,
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
  region: regionName,
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
