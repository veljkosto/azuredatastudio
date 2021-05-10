#!/bin/bash

# Note this script is executed in mssql-test container to collect logs & remove test
# resources prior to the removal of data controller
#

scriptPath=`dirname $0`
echo ${scriptPath}/.test.env
source ${scriptPath}/.test.env

azdata login --namespace ${CLUSTER_NAME} --username ${AZDATA_USERNAME}

# copy logs
#
azdata arc dc debug copy-logs --namespace $CLUSTER_NAME --target-folder /root/debuglogs --verbose --timeout 2400

# clean up any remaining MIAA/pg instances created by the tests (and they should've been cleaned up by the tests)
#
kubectl delete sqlmanagedinstances.sql.arcdata.microsoft.com --all -n ${CLUSTER_NAME} || true
kubectl delete postgresqls.arcdata.microsoft.com --all -n ${CLUSTER_NAME} || true

# cleanup test driver pods/services/rolebindings
#
kubectl get clusterrolebinding rb-test-admin > /dev/null 2>&1 && kubectl delete clusterrolebinding rb-test-admin || true
kubectl get pods -n ${CLUSTER_NAME} | grep clustertest | awk '{print $1}' | xargs kubectl delete pod -n ${CLUSTER_NAME}  || true
kubectl get svc failureinjection-svc-external -n ${CLUSTER_NAME} > /dev/null 2>&1 && kubectl delete service -n ${CLUSTER_NAME} failureinjection-svc-external || true
kubectl get pods ganachecli -n ${CLUSTER_NAME} > /dev/null 2>&1 && kubectl delete pods -n ${CLUSTER_NAME} ganachecli || true
kubectl get svc blockchain-svc -n ${CLUSTER_NAME} > /dev/null 2>&1 && kubectl delete service -n ${CLUSTER_NAME} blockchain-svc || true
