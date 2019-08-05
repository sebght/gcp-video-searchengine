import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

import * as fs from "fs";
import * as mime from "mime";
import * as path from "path";

// Load the Pulumi program configuration. These act as the "parameters" to the Pulumi program,
// so that different Pulumi Stacks can be brought up using the same code.

const stackConfig = new pulumi.Config("static-website");
const config = {
  // pathToWebsiteContents is a relativepath to the website's contents.
  pathToWebsiteContents: stackConfig.require("pathToWebsiteContents"),
  bucketName: stackConfig.require("bucketName"),
  region: stackConfig.require("region")
};

// contentBucket is the S3 bucket that the website's contents will be stored in.
const siteBucket = new gcp.storage.Bucket(config.bucketName, {
  name: config.bucketName,
  location: config.region,
  bucketPolicyOnly: true,
  websites: [
    {
      mainPageSuffix: "index.html"
    }
  ]
});

const binding = new gcp.storage.BucketIAMBinding("member", {
  bucket: siteBucket.name,
  members: ["allUsers"],
  role: "roles/storage.objectViewer",
});

// crawlDirectory recursive crawls the provided directory, applying the provided function
// to every file it contains. Doesn't handle cycles from symlinks.
function crawlDirectory(dir: string, f: (_: string) => void) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = `${dir}/${file}`;
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      crawlDirectory(filePath, f);
    }
    if (stat.isFile()) {
      f(filePath);
    }
  }
}

// Sync the contents of the source directory with the S3 bucket, which will in-turn show up on the CDN.
const webContentsRootPath = path.join(
  process.cwd(),
  config.pathToWebsiteContents
);
console.log("Syncing contents from local disk at", webContentsRootPath);
crawlDirectory(webContentsRootPath, (filePath: string) => {
  const relativeFilePath = filePath.replace(webContentsRootPath + "/", "");
  const contentFile = new gcp.storage.BucketObject(
    relativeFilePath,
    {
      bucket: siteBucket.name,
      contentType: mime.getType(filePath) || undefined,
      name: relativeFilePath,
      source: filePath,
    },
    {
      parent: siteBucket
    }
  );
});

export const siteBucketName = siteBucket.name;
export const siteBucketWebsiteEndpoint = siteBucket.name.apply(u => `${u}.storage.googleapis.com`);