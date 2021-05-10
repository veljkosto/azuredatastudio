#!/bin/bash

# Note this script is executed in mssql-test container to create data controller
# in an existing kubeadm cluster
#

# Setup on test environment and create patch file based on environment variables
#

scriptPath=`dirname $0`

echo ${scriptPath}/.test.env
source ${scriptPath}/.test.env

envsubst < ${scriptPath}/patch.${KUBERNETES_ENVIRONMENT}.json.tmpl > ${scriptPath}/patch.json

# Apply the patch and create data controller
PROFILE=azure-arc-${KUBERNETES_ENVIRONMENT}

azdata arc dc config init -s ${PROFILE} --path ${scriptPath}/custom --force

azdata arc dc config patch --path ${scriptPath}/custom/control.json --patch-file ${scriptPath}/patch.json

azdata arc dc create --debug --path ${scriptPath}/custom \
    --namespace ${CLUSTER_NAME} \
    --name ${TEST_DATA_CONTROLLER_NAME} \
    --subscription ${SUBSCRIPTION_ID} \
    --resource-group ${RESOURCE_GROUP_NAME} \
    --location ${LOCATION} \
    --connectivity-mode ${CONNECTIVITY_MODE}

echo "Azure Arc Data Controller cluster created."

# Login and get endpoint list for the cluster.
#
azdata login --namespace $CLUSTER_NAME

echo "Cluster successfully setup. Run 'azdata --help' to see all available options."
