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

1. put it in a folder, e.g., `owd-lib-layer`
3. Structure the folders exactly as below, with the zip containing `nodejs/` and below
4. Zip it as `zip -r owdlib.zip . `
5. After deploying, use the import as `import * as owd from '/opt/nodejs/node20/owd.mjs'`


~~~
├── nodejs
│   └── node20
│       ├── node_modules
│       │   └── nanoid
│       ├── owd.mjs
│       └── package.json
└── owdlib.zip

~~~