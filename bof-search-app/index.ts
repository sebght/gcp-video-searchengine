import * as f from './backend/cloud-functions/index';
import {siteBucketName, siteBucketWebsiteEndpoint} from './client/pulumi/index';
import * as setup from './backend/resources/index';

import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

console.log(`Démarrage du Big Daddy Pulumi`);

const buildEnvJsFile = ([signUrlValue, firestoreUrlValue, srcBucketName]: string[]) => {
    return `
window.env = {
    SIGN_URL: '${signUrlValue}',
    FIRESTORE_URL: '${firestoreUrlValue}',
    VIDEO_BUCKET: '${srcBucketName}'
  }`;
};

const envJs = new gcp.storage.BucketObject("env.js", {
    name: "env.js",
    bucket: siteBucketName,
    content: pulumi.all([f.SignedPostEndpoint, f.createBofEndpoint, setup.sourceBucketName]).apply(buildEnvJsFile)
});

export const websiteUrl = siteBucketWebsiteEndpoint;