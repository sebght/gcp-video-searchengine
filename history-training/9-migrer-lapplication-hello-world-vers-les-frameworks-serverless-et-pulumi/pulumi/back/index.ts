import * as gcp from "@pulumi/gcp";

let greeting = new gcp.cloudfunctions.HttpCallbackFunction("helloPulumi", (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.send("Hello World!");
});

export let url = greeting.httpsTriggerUrl;