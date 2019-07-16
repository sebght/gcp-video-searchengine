import * as gcp from "@pulumi/gcp";
import { asset } from "@pulumi/pulumi";

const functionName = "helloGet";

const bucket = new gcp.storage.Bucket(`${functionName}_bofsearch`);

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
  entryPoint: "handler",
  httpsTriggerUrl: `https://us-central1-stage-bof-search.cloudfunctions.net/${functionName}`,
  triggerHttp: true,
});

export let helloGetEndpoint = functionhw.httpsTriggerUrl;
