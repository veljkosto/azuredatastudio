#!/bin/bash

#
# This script cleans up any orphaned mount services by kubelet. We do this by finding all
# services in /sys/fs/cgroup/devices that refers to a pod/directory that no longer exists
# and stopping the service
#

# Get the directory of the scripts
SCRIPT_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

source $SCRIPT_DIR/common-node.sh

if is_root -eq 0; then
    exit
fi

# If we failed to stop any services, print an error message so that the user knows to check the error output
#
SERVICE_STOP_FAILED=0

# get the kubelet working directory
KUBELET_DIR0=/var/lib/kubelet
KUBELET_DIR1=$( get_kubelet_directory_from_configuration )

systemctl | egrep -i "$KUBELET_DIR0/pods|$KUBELET_DIR1/pods" | while read -r line; do

    # Retrieve the mount path
    #
    MOUNT_PATH=`echo "$line"  | grep -v echo | egrep -oh -m 1 -i "($KUBELET_DIR0/pods).+|($KUBELET_DIR1/pods).+"`

    if [ -z "$MOUNT_PATH" ]; then
        continue
    fi

    if [[ ! -d "$MOUNT_PATH" ]] && [[ ! -f "$MOUNT_PATH" ]]; then

        SERVICE=$(echo $line | cut -f1 -d' ')

        echo "Mount "$MOUNT_PATH" no longer exists."
        echo "Stopping orphaned mount service: '$SERVICE'"

        systemctl stop $SERVICE

        if [ $? -ne 0 ]; then
            SERVICE_STOP_FAILED=1
        fi

        echo ""
    fi
done

if [ $SERVICE_STOP_FAILED -ne 0 ]; then
    echo "Not all services were stopped successfully. Please check the above output for more inforamtion."
else
    echo "All orphaned services successfully stopped."
fi
