# Commands

## to create a .json file of the template from Markdown

./ses.js -a template -f ../ses/ses-welcome.md -n "Welcome" -s "Welcome to OnWhichDate service" > ../ses/ses-welcome.json 

## to create a new template
aws ses create-template --cli-input-json file://ses/TestTemplate.json

# to update an existing template: just use the input json file
aws ses update-template  --cli-input-json file://ses/ses-welcome.json 

# insert an item into DynamoDB
aws dynamodb put-item --table-name "db-customer" --item file://dynamoDB/db-customer-test-item.json

## DynamoDB references
base CID: xuVbNjdkLuImnKd