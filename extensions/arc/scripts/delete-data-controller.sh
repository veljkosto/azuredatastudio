#!/bin/bash

# Note this script is executed in mssql-test container to delete data controller
# from an existing kubeadm cluster
#

scriptPath=`dirname $0`
echo ${scriptPath}/.test.env
source ${scriptPath}/.test.env

azdata login --namespace ${CLUSTER_NAME} --username ${AZDATA_USERNAME}
azdata arc dc delete --namespace ${CLUSTER_NAME} --name ${TEST_DATA_CONTROLLER_NAME} --force --yes
kubectl delete crd datacontrollers.arcdata.microsoft.com  || true
kubectl delete crd sqlmanagedinstances.sql.arcdata.microsoft.com || true
kubectl delete crd postgresqls.arcdata.microsoft.com  || true