# Commands

## reference numbers

cid: HbWUAV7JaA6cio3 / m.venugopal@example.com

## to create a .json file of the template from Markdown

./ses.js -a template -f ../ses/ses-welcome.md -n "Welcome" -s "Welcome to OnWhichDate service" > ../ses/ses-welcome.json 

## to create a new template
aws ses create-template --cli-input-json file://ses/TestTemplate.json

## to update an existing template: just use the input json file
aws ses update-template  --cli-input-json file://ses/ses-welcome.json 

## get an item from dynamoDB
aws dynamodb get-item --table-name db-customer --key '{"cid": {"S": "xuVbNjdkLuImnKd"}}'
aws dynamodb get-item --table-name "db-document" --key '{"id": {"S": "travel#passport#us"}, "state": {"S": "na"}}'

## insert an item into DynamoDB
aws dynamodb put-item --table-name "db-customer" --item file://dynamoDB/db-customer-test-item.json

## DynamoDB references
base CID: xuVbNjdkLuImnKd

## API Gateway

format: https://api-id.execute-api.region.amazonaws.com/stage

= https://rzgoq22zk5.execute-api.us-east-1.amazonaws.com/dev

## deploying self-made layers

**update**: go to the `lib` layer and run `./owdlib.sh -d "description for layer"` which will update the owdlib layer. replicate for others.

1. put it in a folder, e.g., `owd-lib-layer`
3. Structure the folders exactly as below, with the zip containing `nodejs/` and below
4. Zip it as `zip -r owdlib.zip . `
5. After deploying, use the import as `import * as owd from '/opt/nodejs/node20/owd.mjs'`

To add a new package, go to `node20` and to npm i after updating the `package.json`


~~~
├── nodejs
│   └── node20
│       ├── node_modules
│       │   └── nanoid
│       ├── owd.mjs
│       └── package.json
└── owdlib.zip

~~~


### Common mistakes

1. making dynamoDB record comparisons without type strings: e.g., `if (email === record.email) instead of if (email === record.email.S)`
2. sending empty objects in insert or update
3. Ending REST send objects so the last field ends with a , for example. Perfect JSON should have no trailing ,.

~~~

{
   "a": "value",
   "b": "value",
}

~~~
4. a 500 Internal Server error could mean:
   1. Syntax error in the code! Check that first
   2. Some function signature is incomplete (e.g., calling `owd.Response({...})` instead of `owd.Response(code, {...})`)


# OWD COM

## Create docDb search file (run it from ./owdcom root)

`npx astro db execute ./src/lib/generate-docDb-local.mjs --remote`


# Nudge dispatch architecture

(API Gateway) /api/nudge --> call this to send the notice; the notice has content for email, SMS etc.

api/nudge  -> lambda-process-nudge (extracts the incoming nudge JSON, does some basic validation/security test, and then puts its on the SQS nudge-queue; we can eventually split this to transaction and batch)

nudge-q -> lambda-send-nudge sends it out the SES call or via Twilio SMS eventually as needed.

So, summary:

1) for transactional messages - i.e., where eznudge.com needs to send on a case-basis;

/api/nudge --> lambda-process-nudge --> nudge-q --> lambda-send-nudge

2) for core event dispatches - i.e., processing events on X schedule,

Event Bridge --> lambda-fetch-nudges (calls eznudge.com/api/fetch) --> nudge-q --> lambda-send-nudge

