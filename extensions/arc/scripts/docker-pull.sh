#!/bin/bash

IMAGES=(
    arc-bootstrapper
    arc-postgres-11
    arc-postgres-12
    azdata
    arc-control-watchdog
    arc-controller
    mssql-failure-injection
    arc-sqlmi
    arc-monitor-collectd
    arc-monitor-elasticsearch
    arc-monitor-fluentbit
    arc-monitor-grafana
    arc-monitor-influxdb
    arc-monitor-kibana
    arc-monitor-telegraf
    arc-server-controller
    arc-service-proxy
    mssql-test
)

echo ""
echo "############################################################################"
echo "Login to source registry: " $SOURCE_DOCKER_REGISTRY
docker login $SOURCE_DOCKER_REGISTRY -u $SOURCE_DOCKER_USERNAME -p $SOURCE_DOCKER_PASSWORD

echo "Starting to pull docker images..."
echo "Pulling images from repository: " $SOURCE_DOCKER_REGISTRY"/"$SOURCE_DOCKER_REPOSITORY
for image in "${IMAGES[@]}";
do
    docker pull $SOURCE_DOCKER_REGISTRY/$SOURCE_DOCKER_REPOSITORY/$image:$SOURCE_DOCKER_TAG
    echo "Docker image" $image " pulled."
done
