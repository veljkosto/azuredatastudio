#!/bin/bash

DIR="$(cd "$(dirname "$0")" && pwd)"

source $DIR/common-node.sh

if is_root -eq 0; then
    exit
fi

# get the kubelet working directory
KUBELET_DIR0=/var/lib/kubelet
KUBELET_DIR1=$( get_kubelet_directory_from_configuration )

kubeadm reset --force

systemctl stop kubelet
rm -rf /var/lib/cni/
if [ ! -z "$KUBELET_DIR0" ]; then
    rm -rf $KUBELET_DIR0/* 2>/dev/null
fi
if [ ! -z "$KUBELET_DIR1" ]; then
    rm -rf $KUBELET_DIR1/* 2>/dev/null
fi
rm -rf /etc/cni/
rm -rf /var/lib/etcd/*
rm -rf /var/tmp/aris/pv
rm -rf /var/tmp/local-storage

ifconfig cni0 down
brctl delbr cni0
ifconfig flannel.1 down

# Cleanup any orphaned kubelet mount services
#
$DIR/cleanup-mount-services.sh

#If restartDocker is passed as argument then run:
TEMP=$(getopt -o restartDocker:: -- "$@")
eval set "$TEMP"
case "$1" in
    restartDocker)
        echo "Restarting docker"
        service docker restart
        ;;
    *)
        ;;
esac
