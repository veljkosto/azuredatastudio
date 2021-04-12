#!/bin/bash
scriptPath=`dirname $0`
source $scriptPath/common.sh

# collect logs & clean up test resources
#
docker exec mssql-test /root/prepare-cleanup.sh

# delete data controller
#
docker exec mssql-test /root/delete-data-controller.sh

# clean up the PV/PVCs and uninstall static storage provisoner
#
kubectl get pvc --no-headers -n ${CLUSTER_NAME} | awk '{print $1}' | xargs kubectl delete pvc -n ${CLUSTER_NAME}  || true

TEST_NAMESPACES=$(kubectl get ns | grep "\-ns\-" | awk '{print $1}')

# Iterate through random namespaces generated during the test and delete PVCs in it
#
if [ ! -z "$TEST_NAMESPACES" ]
then
	for NS in "${TEST_NAMESPACES[@]}"
	do
		echo ${NS}
		kubectl get pvc --no-headers -n ${NS} | awk '{print $1}' | xargs kubectl delete pvc --ignore-not-found -n ${NS}  || true
		kubectl delete ns ${NS} --force --grace-period=0 --ignore-not-found || true
	done
fi

# pwd
#
pwd
popd

# copy debuglogs from mssql-test container
#
mkdir -p ${OUTPUT_DIRECTORY}/debuglogs
docker cp mssql-test:root/debuglogs ${OUTPUT_DIRECTORY}/debuglogs

sudo -E ${scriptPath}/storageprovisioner/uninstall.sh

kubectl delete ns ${CLUSTER_NAME} --force --grace-period=0

# set pull policy to IfNotPresent for subsequent iterations
#
export DOCKER_IMAGE_POLICY=IfNotPresent
