#!/bin/bash

set -Eeuo pipefail

# This is a script to create single-node Kubernetes cluster and deploy Azure Arc Data Controller on it.
#
export AZUREARCDATACONTROLLER_DIR=aadatacontroller

# Name of virtualenv variable used.
#
export LOG_FILE="aadatacontroller.log"
export DEBIAN_FRONTEND=noninteractive

# Requirements file.
export OSCODENAME=$(lsb_release -cs)

# Kube version.
#
KUBE_DPKG_VERSION=1.16.3-00
KUBE_VERSION=1.16.3

# Wait for 5 minutes for the cluster to be ready.
#
TIMEOUT=600
RETRY_INTERVAL=5

# Variables used for azdata cluster creation.
#
export ACCEPT_EULA=yes
export PV_COUNT="80"

# Make a directory for installing the scripts and logs.
#
rm -f -r $AZUREARCDATACONTROLLER_DIR
mkdir -p $AZUREARCDATACONTROLLER_DIR
cd $AZUREARCDATACONTROLLER_DIR/
touch $LOG_FILE

{
# Install all necessary packages: kuberenetes, docker, request, azdata.
#
echo ""
echo "######################################################################################"
echo "Starting installing packages..." 

# Install docker.
#
sudo apt-get update -q

sudo apt --yes install \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    curl

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

sudo add-apt-repository \
    "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

sudo apt update -q

echo "apt-get install jq ..."
sudo apt-get install  -y jq

echo "apt-get install docker ..." 

sudo apt-get install -y --allow-downgrades --allow-change-held-packages ebtables ethtool docker-ce=5:19.03* 

echo "restart docker ..." 

# Restart docker.
#
sudo systemctl daemon-reload
sudo systemctl restart docker

echo "Starting to usermod --append --groups docker..." 
sudo usermod --append --groups docker $USER

echo "inconfig:" 
ifconfig

echo "df -h:" 
df -h

echo "whoami"
whoami

echo "activate group docker"

# hack as newgrp seems to prompt & block the pipeline
# newgrp docker
sudo chmod 666 /var/run/docker.sock

}| tee $LOG_FILE