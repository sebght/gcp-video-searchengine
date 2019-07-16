import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

const stackConfig = new pulumi.Config("gcf");
const config = {
  functionName: stackConfig.require("functionName")
};

let greeting = new gcp.cloudfunctions.HttpCallbackFunction(config.functionName, (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.send("Hello World!");
});

export let url = greeting.httpsTriggerUrl;
