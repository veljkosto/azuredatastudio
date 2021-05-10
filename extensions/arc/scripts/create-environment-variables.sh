#!/bin/bash

if [ $# -eq 0 ]; then
    ENV_FILE=/tmp/.test.env
else
    ENV_FILE=$1
fi

# Specify a distinct cluster name (thus namespace) for each nightly pipeline job
# to mitigate cascading deletion issue in ARO
# If CLUSTER_NAME is preset by pipeline then the preset value will be used
export CLUSTER_NAME=${CLUSTER_NAME:-dc$(date +"%m%d%y")}

echo "command arguments: " $@

scriptPath=`dirname $0`

envsubst < $scriptPath/.test.env.tmpl > ${ENV_FILE}

echo "Environment variables:"

cat ${ENV_FILE}

