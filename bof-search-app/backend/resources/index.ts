import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const stackConfig = new pulumi.Config("resources");
const config = {
  sourceBucketName: stackConfig.require("sourceBucketName"),
  outputBucketName: stackConfig.require("outputBucketName"),
  region: stackConfig.require("region")
};

const cors_source = [
    {
      origins: ["*"],
      responseHeaders: ["Content-Type", "Authorization",  "Content-Length", "User-Agent", "x-goog-resumable"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      maxAgeSeconds: 3600
    }
]

// Create a GCP resource (Storage Bucket)
const sourceBucket = new gcp.storage.Bucket(config.sourceBucketName, {
    name: config.sourceBucketName,
    location: config.region,
    cors: cors_source
});

const analysisBucket = new gcp.storage.Bucket(config.outputBucketName, {
    name: config.outputBucketName,
    location: config.region,
    cors: cors_source
});

// Export the DNS name of the bucket
export const sourceBucketName = sourceBucket.name;
export const outputBucketName = analysisBucket.name;
