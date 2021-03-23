#!/bin/bash

# This script removes all PVs associated with SC defined
# in  $scriptPath/storageclass.yaml and all the backup local
# folders
#
scriptPath=`dirname $0`

# Uninstall storage class
kubectl delete -f $scriptPath/storageclass.yaml 2>/dev/null || true

# remove remnant persistent volumes
kubectl get persistentvolumes | grep local-storage | awk '{ print $1 }' | xargs kubectl delete pv --ignore-not-found --force 2>/dev/null || true

# Uninstall provisoner
#
kubectl delete -f $scriptPath/provisioner.yaml 2>/dev/null || true

PV_COUNT=${PV_COUNT:-300}

# Unmount and remove local folders 
# Ensure mount point disappears before removing the folder
for i in $(seq 1 $PV_COUNT); do
  export PV_NUMBER=$i

  RETRY=0
  while (( $RETRY <= 5 ))
  do
    if [[ $(findmnt /mnt/disks/$PV_NUMBER) ]]; then
      sudo umount /mnt/disks/$PV_NUMBER -f
      sleep 0.2
      RETRY=$((RETRY+1))
    else
      RETRY=6
    fi
  done

  sudo rm -rf /mnt/disks/$PV_NUMBER
  sudo rm -rf /var/tmp/tina/pv/$PV_NUMBER
done

sudo rm -rf /mnt/disks