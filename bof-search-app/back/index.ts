import * as gcp from "@pulumi/gcp";
import { asset } from "@pulumi/pulumi";

const functionhwName = "helloGet"
const functionsuName = "getSignedURL_bof"
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

// Fonction qui renvoit une Signed URL au client

const bucketObjectSignedURL = new gcp.storage.BucketObject("su-zip", {
  bucket: bucket.name,
  source: new asset.AssetArchive({
      ".": new asset.FileArchive("./signed-url"),
  }),
});

const functionSignedURL = new gcp.cloudfunctions.Function(functionsuName, {
  sourceArchiveBucket: bucket.name,
  runtime: "nodejs10",
  sourceArchiveObject: bucketObjectSignedURL.name,
  entryPoint: "getSignedUrl",
  triggerHttp: true,
  name: functionsuName
});

export let helloGetEndpoint = functionhw.httpsTriggerUrl;
export let SignedPostEndpoint = functionSignedURL.httpsTriggerUrl;
