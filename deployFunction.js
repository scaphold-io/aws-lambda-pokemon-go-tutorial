var AWS = require('aws-sdk');
var fs = require('fs');
var path = require('path');

var lambda = new AWS.Lambda({
    region: "us-west-2",
    logger: process.stdout
});

if (process.argv.length <= 2) {
    console.log("You must give a function name to deploy.");
    process.exit(1);
}
const FUNCTION_NAME = process.argv[2];
const FUNCTION_HANDLER = "dist/index.handler";

const FUNCTION_ROLE = "arn:aws:iam::xxxxxxxxxxxx:role/lambda_basic_execution"; // Change this. Use the IAM role ARN that you configured.

console.log("Deploying function with zip " + FUNCTION_NAME); 
const zipPath = path.join(__dirname, FUNCTION_NAME + '.zip');
var file = "";
try {
    fs.accessSync(zipPath, fs.F_OK);
    file = fs.readFileSync(zipPath);
} catch(e) {
    console.log("Could not find zip file at ", zipPath);
}

// get function
// if doesn't exist, then create it
// if it does, then update it

var params = {
  FunctionName: FUNCTION_NAME, /* required */
};
return new Promise(function(resolve, reject) {
    lambda.getFunction(params, function(err, data) {
        if (err) {
            console.log("Function NOT FOUND " + FUNCTION_NAME);
            //   console.log(err, err.stack);
            resolve(true);
        }
        else {
            console.log("Function FOUND " + FUNCTION_NAME);
            //   console.log(data);
            resolve(false);
        }
    })
}).then(function(shouldCreateFunction) {
    if (shouldCreateFunction) {
        createFunction();
    } else {
        updateFunction();
    }
});

function createFunction() {
    console.log("Creating function at " + FUNCTION_NAME + "...");
    var params = {
    Code: { /* required */
        // S3Bucket: config.aws.s3.bucket,
        // S3Key: config.aws.s3.key,
        // S3ObjectVersion: config.aws.s3.version,
        ZipFile: new Buffer(file)
    },
    FunctionName: FUNCTION_NAME, /* required */
    Handler: FUNCTION_HANDLER, /* required */
    Role: FUNCTION_ROLE, /* required */
    Runtime: 'nodejs4.3', /* required */
    Description: "iOS Push Notification webhook using Scaphold's Custom Integration.",
    Publish: true,
    Timeout: 10
    //   VpcConfig: {
    //     SecurityGroupIds: [
    //       'STRING_VALUE',
    //       /* more items */
    //     ],
    //     SubnetIds: [
    //       'STRING_VALUE',
    //       /* more items */
    //     ]
    //   }
    };
    lambda.createFunction(params, function(err, data) {
        if (err) {
            console.log("Error has occurred while creating function " + FUNCTION_NAME + " to AWS Lambda.");
            console.log(err, err.stack);
        } else {
            console.log("Successfully created function " + FUNCTION_NAME + " to AWS Lambda.");
            console.log(data);
        }
    });
}

function updateFunction() {
    console.log("Updating function at " + FUNCTION_NAME + "...");
    var params = {
        FunctionName: FUNCTION_NAME, /* required */
        Publish: true,
        ZipFile: new Buffer(file)
    };
    lambda.updateFunctionCode(params, function(err, data) {
        if (err) {
            console.log("Error has occurred while updating function " + FUNCTION_NAME + " to AWS Lambda.");
            console.log(err, err.stack);
        } else {
            console.log("Successfully updated function " + FUNCTION_NAME + " to AWS Lambda.");
            console.log(data);
        }
    });
}
