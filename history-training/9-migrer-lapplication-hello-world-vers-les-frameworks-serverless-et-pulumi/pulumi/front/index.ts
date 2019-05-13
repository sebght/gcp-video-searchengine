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
  pathToWebsiteContents: stackConfig.require("pathToWebsiteContents")
  // // targetDomain is the domain/host to serve content at.
  // targetDomain: stackConfig.require("targetDomain"),
  // // (Optional) ACM certificate ARN for the target domain; must be in the us-east-1 region. If omitted, an ACM certificate will be created.
  // certificateArn: stackConfig.get("certificateArn"),
};

// contentBucket is the S3 bucket that the website's contents will be stored in.
// TODO find a way to point to the correct name with the suffix
const siteBucket = new gcp.storage.Bucket("pulumi.octo-bof-se.ga", {
  name: "pulumi.octo-bof-se.ga",
  location: "us-central1",
  websites: [
    {
      mainPageSuffix: "index-stage-bof-search.html",
      notFoundPage: "404-stage-bof-search.html"
    }
  ]
});

// TODO replace 'Lecteur des anciens ensembles' par 'Lecteur normal'
const defaultAcl = new gcp.storage.BucketACL("pulumi-demo-acl", {
  bucket: siteBucket.name,
  roleEntities: ['READER:allUsers'],
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
  console.log(filePath);
  console.log(relativeFilePath);
  const contentFile = new gcp.storage.BucketObject(
    relativeFilePath,
    {
      bucket: siteBucket.name,
      contentType: mime.getType(filePath) || undefined,
      source: new pulumi.asset.FileAsset(filePath),
    },
    {
      parent: siteBucket
    }
  );
});
