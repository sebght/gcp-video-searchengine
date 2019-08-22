import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const stackConfig = new pulumi.Config("resources");
const config = {
  sourceBucketName: stackConfig.require("sourceBucketName"),
  sourceConvBucketName : stackConfig.require("sourceConvBucketName"),
  outputBucketName: stackConfig.require("outputBucketName"),
  region: stackConfig.require("region"),
  functionsBucketName: stackConfig.require("functionsBucketName")
};

const functionhwName = "helloGet";
const functionsuName = "getSignedURL";
const functionnbName = "createBof";
const functionfuName = "reportsFileUploads";
const functioncaName = "convertAudioBof";
const functionsttName = "speechToText";
const functionekwName = "getKeyWords";
const functiongbName = "getAllBofs"
const bucketName = config.functionsBucketName;
const regionName = config.region;
const source_bucket = config.sourceBucketName;
const source_converted_bucket = config.sourceConvBucketName;
const output_bucket = config.outputBucketName;

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

const bucketObjectUploadBof = new gcp.storage.BucketObject("ub-zip", {
  bucket: bucket.name,
  source: new pulumi.asset.AssetArchive({
      ".": new pulumi.asset.FileArchive("./backend/cloud-functions/upload-bof"),
  }),
});

// Fonction qui renvoie une Signed URL au client

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

// Fonction qui initialise la création de la BoF dans la table Firestore

const functionCreateBof = new gcp.cloudfunctions.Function(functionnbName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
  runtime: "nodejs8",
  sourceArchiveObject: bucketObjectUploadBof.name,
  entryPoint: "createNewBof",
  triggerHttp: true,
  name: functionnbName,
  environmentVariables: {
    bucket_input: source_bucket,
    bucket_output: output_bucket
  }
});

// Fonction qui reporte l'ajout de fichiers à une BoF dans Firestore

const functionFileUploads = new gcp.cloudfunctions.Function(functionfuName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
  runtime: "nodejs10",
  sourceArchiveObject: bucketObjectUploadBof.name,
  entryPoint: "reportsFileUploads",
  eventTrigger: {
    eventType: "google.storage.object.finalize",
    resource: source_bucket
  },
  name: functionfuName
});

const bucketObjectContentAnalysis = new gcp.storage.BucketObject("ca-zip", {
  bucket: bucket.name,
  source: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./backend/cloud-functions/content-analysis"),
  }),
});

// Fonction qui convertit l'audio fourni afin d'être ok pour l'analyse

const functionConvertAudio = new gcp.cloudfunctions.Function(functioncaName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
  availableMemoryMb: 1024,
  runtime: "nodejs8",
  sourceArchiveObject: bucketObjectContentAnalysis.name,
  entryPoint: "convertAudioBof",
  eventTrigger: {
    eventType: "google.storage.object.finalize",
    resource: source_bucket
  },
  environmentVariables: {
    bucket_output: source_converted_bucket
  },
  name: functioncaName
});

// Fonction qui fait l'analyse Speech-To-Text sur l'audio converti

const functionSpeechText = new gcp.cloudfunctions.Function(functionsttName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
  runtime: "nodejs8",
  sourceArchiveObject: bucketObjectContentAnalysis.name,
  entryPoint: "speechToText",
  eventTrigger: {
    eventType: "google.storage.object.finalize",
    resource: source_converted_bucket
  },
  timeout: 540,
  environmentVariables: {
    bucket_output: output_bucket
  },
  name: functionsttName
});

// Fonction qui extraie du transcript des tags

const functionExtractKeys = new gcp.cloudfunctions.Function(functionekwName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
  runtime: "nodejs8",
  sourceArchiveObject: bucketObjectContentAnalysis.name,
  entryPoint: "getKeywords",
  eventTrigger: {
    eventType: "google.storage.object.finalize",
    resource: output_bucket
  },
  name: functionekwName
});

const bucketObjectListItemsBof = new gcp.storage.BucketObject("li-zip", {
  bucket: bucket.name,
  source: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./backend/cloud-functions/list-items"),
  }),
});

const functionGetBofs = new gcp.cloudfunctions.Function(functiongbName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
  runtime: "nodejs10",
  sourceArchiveObject: bucketObjectListItemsBof.name,
  entryPoint: "getAllBofs",
  triggerHttp: true,
  name: functiongbName
});

export let helloGetEndpoint = functionhw.httpsTriggerUrl;
export let SignedPostEndpoint = functionSignedURL.httpsTriggerUrl;
export let createBofEndpoint = functionCreateBof.httpsTriggerUrl;
export let listBofEndpoint = functionGetBofs.httpsTriggerUrl;
