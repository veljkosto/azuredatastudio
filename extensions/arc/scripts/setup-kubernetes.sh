#!/bin/bash

scriptPath=`dirname $0`
source $scriptPath/common.sh

# Clean up the cluster
#
echo "If reset-kubeadm.sh hangs, try doing a sudo service docker restart"
sudo -E projects/common/reset-kubeadm.sh || error_exit "Failed to reset kubeadm"

# This will remove:
#    - all stopped containers
#    - all networks not used by at least one container
#    - all volumes not used by at least one container
#    - all images without at least one container associated to them
#    - all build cache
sudo docker system prune --volumes --all --force
sudo -E NODE_LABEL=gci projects/common/start-kubeadm.sh

# Make sure there are no untracked files in the repository
#
git clean -xfd

# Download/Pre-fetch container images: only perform this when k8s environment is kubeadm
# as current machine is the hosting node for k8s cluster
#
$scriptPath/docker-pull.sh

kubectl get pods -A
kubectl config get-contexts
