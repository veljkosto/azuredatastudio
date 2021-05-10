#!/bin/bash

# This script generated PV_COUNT PVs based on storage class defined
# in $scriptPath/storageclass.yaml

# num of persistent volumn will be created in local when running make on a local context "make deploy-local, make deploy-ci-local".
PV_COUNT=${PV_COUNT:-300}

scriptPath=`dirname $0`

# Cleanup remnant resources from previous install
#
sudo $scriptPath/uninstall.sh

# Create static PVs using local storage
#
for i in $(seq 1 $PV_COUNT); do
  export PV_NUMBER=$i
  if [ ! -d /mnt/disks/$PV_NUMBER ]; then
    mkdir -p /var/tmp/tina/pv/$PV_NUMBER
    sudo mkdir -p /mnt/disks/$PV_NUMBER
    sudo mount -o bind /var/tmp/tina/pv/$PV_NUMBER /mnt/disks/$PV_NUMBER
  fi
done

# Create storage class
#
kubectl apply -f $scriptPath/storageclass.yaml
kubectl patch storageclass local-storage -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'

# Deploy provisioner
kubectl create -f $scriptPath/provisioner.yaml

# Sleep 30 seconds for PVs become online
sleep 30
