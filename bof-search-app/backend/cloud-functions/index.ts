import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const stackConfig = new pulumi.Config("resources");
const config = {
  sourceBucketName: stackConfig.require("sourceBucketName"),
  sourceConvBucketName : stackConfig.require("sourceConvBucketName"),
  outputBucketName: stackConfig.require("outputBucketName"),
  region: stackConfig.require("region"),
  functionsBucketName: stackConfig.require("functionsBucketName"),
  algoliaID: stackConfig.require("algoliaID"),
  algoliaAPIkey: stackConfig.require("algoliaAPIkey")
};

const functionsuName = "getSignedURL";
const functionnbName = "createBof";
const functionfuName = "reportsFileUploads";
const functioncaName = "convertAudioBof";
const functionvttName = "slidesToText";
const functionclnName = "slideAnalysisCleaning";
const functionsttName = "speechToText";
const functionekwName = "getKeyWordsAudio";
const functionekwsName = "getKeyWordsSlides";
const functiongbName = "getAllBofs";
const functionraName = "reportsToAlgolia";
const bucketName = config.functionsBucketName;
const regionName = config.region;
const source_bucket = config.sourceBucketName;
const source_converted_bucket = config.sourceConvBucketName;
const output_bucket = config.outputBucketName;

const bucket = new gcp.storage.Bucket(`${bucketName}_bofsearch`,{
  name: `${bucketName}_bofsearch`,
  location: regionName
});

const bucketObjectUploadBof = new gcp.storage.BucketObject("ub-zip", {
  bucket: bucket.name,
  source: new pulumi.asset.AssetArchive({
      ".": new pulumi.asset.FileArchive("./backend/cloud-functions/upload-bof"),
  }),
}, {
  parent: bucket
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
}, {
  parent: bucketObjectUploadBof
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
    bucket_output: output_bucket,
    algoliaID: config.algoliaID,
    algoliaAPIkey: config.algoliaAPIkey
  }
}, {
  parent: bucketObjectUploadBof
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
}, {
  parent: bucketObjectUploadBof
});

const bucketObjectAudioAnalysis = new gcp.storage.BucketObject("aa-zip", {
  bucket: bucket.name,
  source: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./backend/cloud-functions/audio-analysis"),
  }),
}, {
  parent: bucket
});

// Fonction qui convertit l'audio fourni afin d'être ok pour l'analyse

const functionConvertAudio = new gcp.cloudfunctions.Function(functioncaName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
  availableMemoryMb: 1024,
  runtime: "nodejs8",
  sourceArchiveObject: bucketObjectAudioAnalysis.name,
  entryPoint: "convertAudioBof",
  eventTrigger: {
    eventType: "google.storage.object.finalize",
    resource: source_bucket
  },
  environmentVariables: {
    bucket_output: source_converted_bucket
  },
  name: functioncaName
}, {
  parent: bucketObjectAudioAnalysis
});

// Fonction qui fait l'analyse Speech-To-Text sur l'audio converti

const functionSpeechText = new gcp.cloudfunctions.Function(functionsttName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
  runtime: "nodejs8",
  sourceArchiveObject: bucketObjectAudioAnalysis.name,
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
}, {
  parent: bucketObjectAudioAnalysis
});

// Fonction qui extraie du transcript de l'audio des tags

const functionExtractKeysAudio = new gcp.cloudfunctions.Function(functionekwName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
  runtime: "nodejs8",
  sourceArchiveObject: bucketObjectAudioAnalysis.name,
  entryPoint: "getKeywordsAudio",
  eventTrigger: {
    eventType: "google.storage.object.finalize",
    resource: output_bucket
  },
  environmentVariables: {
    algoliaID: config.algoliaID,
    algoliaAPIkey: config.algoliaAPIkey
  },
  name: functionekwName
}, {
  parent: bucketObjectAudioAnalysis
});

const bucketObjectSlideAnalysis = new gcp.storage.BucketObject("sa-zip", {
  bucket: bucket.name,
  source: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./backend/cloud-functions/slide-analysis"),
  }),
}, {
  parent: bucket
});

// Fonction qui fait l'analyse Vision-To-Text sur le pdf des slides

const functionVisionText = new gcp.cloudfunctions.Function(functionvttName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
  runtime: "nodejs8",
  sourceArchiveObject: bucketObjectSlideAnalysis.name,
  entryPoint: "slidesToText",
  eventTrigger: {
    eventType: "google.storage.object.finalize",
    resource: source_bucket
  },
  timeout: 300,
  environmentVariables: {
    bucket_output: output_bucket
  },
  name: functionvttName
}, {
  parent: bucketObjectSlideAnalysis
});

// Fonction qui cleane l'analyse Vision-To-Text sur le pdf des slides

const functionCleanSlidesToText = new gcp.cloudfunctions.Function(functionclnName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
  runtime: "nodejs8",
  sourceArchiveObject: bucketObjectSlideAnalysis.name,
  entryPoint: "slideAnalysisCleaning",
  eventTrigger: {
    eventType: "google.storage.object.finalize",
    resource: output_bucket
  },
  name: functionclnName
}, {
  parent: bucketObjectSlideAnalysis
});

// Fonction qui extraie du transcript de l'audio des tags

const functionExtractKeysSlides = new gcp.cloudfunctions.Function(functionekwsName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
  runtime: "nodejs8",
  sourceArchiveObject: bucketObjectSlideAnalysis.name,
  entryPoint: "getKeywordsSlides",
  eventTrigger: {
    eventType: "google.storage.object.finalize",
    resource: output_bucket
  },
  environmentVariables: {
    algoliaID: config.algoliaID,
    algoliaAPIkey: config.algoliaAPIkey
  },
  name: functionekwsName
}, {
  parent: bucketObjectSlideAnalysis
});

const bucketObjectListItemsBof = new gcp.storage.BucketObject("li-zip", {
  bucket: bucket.name,
  source: new pulumi.asset.AssetArchive({
    ".": new pulumi.asset.FileArchive("./backend/cloud-functions/list-items"),
  }),
}, {
  parent: bucket
});

const functionGetBofs = new gcp.cloudfunctions.Function(functiongbName, {
  sourceArchiveBucket: bucket.name,
  region: regionName,
  runtime: "nodejs10",
  sourceArchiveObject: bucketObjectListItemsBof.name,
  entryPoint: "getAllBofs",
  triggerHttp: true,
  name: functiongbName
}, {
  parent: bucketObjectListItemsBof
});

// const functionRefreshAlgolia = new gcp.cloudfunctions.Function(functionraName, {
//   sourceArchiveBucket: bucket.name,
//   region: regionName,
//   runtime: "nodejs8",
//   sourceArchiveObject: bucketObjectListItemsBof.name,
//   entryPoint: "reportsToAlgolia",
//   eventTrigger: {
//     eventType: "providers/cloud.firestore/eventTypes/document.write",
//     resource: "bofs/{bofId}"
//   },
//   environmentVariables: {
//     algoliaID: config.algoliaID,
//     algoliaAPIkey: config.algoliaAPIkey
//   },
//   name: functionraName
// }, {
//   parent: bucketObjectListItemsBof
// });

export let SignedPostEndpoint = functionSignedURL.httpsTriggerUrl;
export let createBofEndpoint = functionCreateBof.httpsTriggerUrl;
export let listBofEndpoint = functionGetBofs.httpsTriggerUrl;
