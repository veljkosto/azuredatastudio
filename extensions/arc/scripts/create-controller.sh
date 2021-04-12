#!/bin/bash
scriptPath=`dirname $0`
source $scriptPath/common.sh

print_system_statistics() {
    if [ $# -eq 1 ]; then
        echo $1
    fi
    date
    free -h -m
    ps aux --sort=-pmem,-rss | head -n 64
    df -h
    kubectl get pods,svc,statefulsets,secrets,crds,deployments,pvc,pv -A
	kubectl describe pods --namespace ${CLUSTER_NAME}
}

repeat_print_system_statistics() {
    while true; do
        print_system_statistics
        sleep 300
    done
}

create_controller() {
	pushd ${scriptPath}/..

	# print out system statistics prior to each deployment
	#
	print_system_statistics "system statistics prior to deployment: ${tid}"

	# remove  test docker container from last iteration
	#
	docker container rm mssql-test --force

	# run mssql-test container in the background
	#
	docker run --name mssql-test -d -v ${HOME}/.kube:/root/.kube -v ${HOME}/.azdata:/root/.azdata ${SOURCE_DOCKER_REGISTRY}/${SOURCE_DOCKER_REPOSITORY}/mssql-test:${SOURCE_DOCKER_TAG} sleep infinity

	# extract commit id from mssql-test image
	#
	COMMIT_ID=-$(docker inspect mssql-test | jq -r '.[0].Config.Labels["git-commit"]' | head -c 8)

	export OUTPUT_DIRECTORY=${scriptPath}/../testoutput/${tid}${COMMIT_ID}
	echo "OUTPUT_DIRECTORY ${OUTPUT_DIRECTORY}"

	# wait 2 seconds
	#
	sleep 2

	# copy configs and stress test scipts to container
	#
	docker cp ${ENV_FILE} mssql-test:root/.test.env
	docker cp ${scriptPath}/patch.${KUBERNETES_ENVIRONMENT}.json.tmpl mssql-test:root/patch.${KUBERNETES_ENVIRONMENT}.json.tmpl
	docker cp ${scriptPath}/create-data-controller.sh mssql-test:root/create-data-controller.sh
	docker cp ${scriptPath}/delete-data-controller.sh mssql-test:root/delete-data-controller.sh
	docker cp ${scriptPath}/prepare-cleanup.sh mssql-test:root/prepare-cleanup.sh

	# only need to create static storage provisioner when the cluster is kubeadm
	#
	sudo -E ${scriptPath}/storageprovisioner/install.sh

	# start to print out statistics repeatedly prior to the deployment
	#
	repeat_print_system_statistics &
	printSystemStatsProcPid=$!

	echo "printSystemStatsProcPid = ${printSystemStatsProcPid}"

	# create data controller
	#
	docker exec mssql-test /root/create-data-controller.sh &
	wait $!

	echo "Done creating controller"

	# print out all the pods
	kubectl get pods -A

	# Stop logging the stats
	#
	kill ${printSystemStatsProcPid}

	envsubst < ${scriptPath}/patch.${KUBERNETES_ENVIRONMENT}.json.tmpl > /tmp/patch.json

	# note start-tests.sh expects CONTROL_CONFIG to be valid however it's currently set in
	# Makefile which cannot be used by pipeline as the agent is a VM instance in Azure and
	# cannot build.
	#
	# copy control.json from mssql-test container as it's already properly patched with azdata
	# command as part of create-data-controller.sh above
	#
	export CONTROL_CONFIG=/tmp/control.json
	docker cp mssql-test:root/custom/control.json ${CONTROL_CONFIG}

	echo "echoing the content of control config"
	cat ${CONTROL_CONFIG}
}

echo "Login to source registry: " $SOURCE_DOCKER_REGISTRY
docker login $SOURCE_DOCKER_REGISTRY -u $SOURCE_DOCKER_USERNAME -p $SOURCE_DOCKER_PASSWORD

create_controller
