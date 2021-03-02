#!/bin/bash -e

# Get the directory of the scripts
SCRIPT_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
# Prepare the dependencies for kubeadm
$SCRIPT_DIR/prepare-kubeadm.sh

# Wait one minute for the cluster to be ready
#
TIMEOUT=120
RETRY_INTERVAL=5

# Create init args for kubeadm
#
rm -f /tmp/kubeadm-init-args.conf
cat <<EOF > /tmp/kubeadm-init-args.conf
apiVersion: kubeadm.k8s.io/v1beta1
kind: ClusterConfiguration
apiServer:
  extraArgs:
    service-node-port-range: 50-32767
networking:
  podSubnet: 100.64.0.0/16
EOF
