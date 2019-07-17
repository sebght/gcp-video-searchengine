import * as gcp from "@pulumi/gcp";
import { asset } from "@pulumi/pulumi";

const functionName = "helloGet"
const bucketName = functionName.toLowerCase()
const regionName = "us-central1"

const bucket = new gcp.storage.Bucket(`${bucketName}_bofsearch`,{
  name: `${bucketName}_bofsearch`,
  location: regionName
});

const bucketObjecthw = new gcp.storage.BucketObject("hw-zip", {
  bucket: bucket.name,
  source: new asset.AssetArchive({
      ".": new asset.FileArchive("./hw-func"),
  }),
});

const functionhw = new gcp.cloudfunctions.Function(functionName, {
  sourceArchiveBucket: bucket.name,
  runtime: "nodejs10",
  sourceArchiveObject: bucketObjecthw.name,
  entryPoint: "helloGet",
  triggerHttp: true,
  name: functionName
});

export let helloGetEndpoint = functionhw.httpsTriggerUrl;
