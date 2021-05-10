#!/bin/bash

scriptPath=`dirname $0`
source $scriptPath/common.sh

curl -fSsL https://aka.ms/InstallAzureCLIDeb | sudo bash

#export DOCKER_IMAGE_TAG=$(az acr repository show-tags --username ${SOURCE_DOCKER_USERNAME} --password ${SOURCE_DOCKER_PASSWORD} --name hlsaris --repository ${SOURCE_DOCKER_REPOSITORY}/arc-bootstrapper --top 3 --orderby time_desc | jq '.[2]')

# Workaround: directly set image tag to latest
export DOCKER_IMAGE_TAG=${SOURCE_DOCKER_TAG_CUSTOM:-latest}

# Export the tag to /tmp/.test.env so it can be used by other stress scripts
# Inserted two lines 
#
echo -ne "\n\n" >> ${ENV_FILE}
echo "export SOURCE_DOCKER_TAG=${DOCKER_IMAGE_TAG}" >> ${ENV_FILE}