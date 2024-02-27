# Commands

## to create a .json file of the template from Markdown

./ses.js -a template -f ../ses/ses-welcome.md -n "Welcome" -s "Welcome to OnWhichDate service" > ../ses/ses-welcome.json 

## to create a new template
aws ses create-template --cli-input-json file://ses/TestTemplate.json

## to update an existing template: just use the input json file
aws ses update-template  --cli-input-json file://ses/ses-welcome.json 

## get an item from dynamoDB
aws dynamodb get-item --table-name db-customer --key '{"cid": {"S": "xuVbNjdkLuImnKd"}}'

## insert an item into DynamoDB
aws dynamodb put-item --table-name "db-customer" --item file://dynamoDB/db-customer-test-item.json

## DynamoDB references
base CID: xuVbNjdkLuImnKd

## API Gateway

format: https://api-id.execute-api.region.amazonaws.com/stage

= https://rzgoq22zk5.execute-api.us-east-1.amazonaws.com/dev

