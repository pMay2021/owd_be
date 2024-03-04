#!/bin/bash
# Accept a -d description argument
while getopts "d:" opt; do
    case $opt in
        d)
            DESCRIPTION=$OPTARG
            ;;
        \?)
            echo "Invalid option: -$OPTARG" >&2
            exit 1
            ;;
    esac
done

# Fail if no description is provided
if [ -z "$DESCRIPTION" ]; then
    echo "Please provide a description using the -d option" >&2
    exit 1
fi
# Set the AWS region and profile
AWS_REGION="us-east-1"
AWS_PROFILE="default"

# Set the layer name and ARN
LAYER_NAME="owdlib"
LAYER_ARN="arn:aws:lambda:${AWS_REGION}:627389239307:layer:${LAYER_NAME}:25"

# Set the path to the layer ZIP file
LAYER_FILE="/Users/mdev/code/tmp/owd-layer/owdlib.zip"
LAYER_DIR="/Users/mdev/code/tmp/owd-layer/"

# copy *.msj to /Users/mdev/code/tmp/owd-layer/nodejs/node20
rm -rf /Users/mdev/code/tmp/owd-layer/owdlib.zip
cp ./owd*.mjs /Users/mdev/code/tmp/owd-layer/nodejs/node20/
cd /Users/mdev/code/tmp/owd-layer/
echo "now in " $(pwd)
zip -r ${LAYER_DIR}owdlib.zip .
ls -l

echo "description = " ${DESCRIPTION}

# Update the layer
aws lambda publish-layer-version \
    --region ${AWS_REGION} \
    --profile ${AWS_PROFILE} \
    --layer-name ${LAYER_NAME} \
    --description "${DESCRIPTION}" \
    --compatible-runtimes nodejs20.x \
    --compatible-architectures arm64 \
    --zip-file "fileb://${LAYER_FILE}"

# Remove the copied files
rm -rf /Users/mdev/code/tmp/owd-layer/nodejs/node20/owd*.mjs

# Print the layer ARN
echo "Done: Layer ARN: ${LAYER_ARN}"
ls -l ${LAYER_DIR}