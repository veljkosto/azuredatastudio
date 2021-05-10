#!/bin/bash -xe
# calling convention:
#  prepare-kubeadm.sh [DOCKER_DIR] [KUBELET_DIR] [DOCKER_DIR_CLEAN]
#

export DEBIAN_FRONTEND=noninteractive

# Get the directory of the scripts
SCRIPT_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

source $SCRIPT_DIR/common-node.sh

if is_root -eq 0; then
    exit
fi

if [ -z "$DOCKER_DIR" ]; then
    export DOCKER_DIR=$1
fi
if [ -z "$KUBELET_DIR" ]; then
    export KUBELET_DIR=$2
fi
if [ -z "$DOCKER_DIR_CLEAN" ]; then
    export DOCKER_DIR_CLEAN=$3
fi

# Disable swap
# fstab should be edited only after running swapoff
swapoff -a
sed -i '/ swap / s/^/#/' /etc/fstab

# Add Kubernetes package repository
# Note, at this time xenial is the latest ubuntu release for which
# the apt repo has packages. Perhaps in the future they will add a
# build for focal. Until then, the xenial build appears to work.
#
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
cat <<EOF >/etc/apt/sources.list.d/kubernetes.list
deb http://apt.kubernetes.io/ kubernetes-xenial main
EOF

KUBE_VERSION=1.15.0-00

# Get dependent packages
#
apt-get update
apt-get install -y --allow-downgrades ebtables ethtool docker-ce=5:19.03* apt-transport-https \
    kubernetes-cni=0.7.5-00 kubelet=$KUBE_VERSION kubeadm=$KUBE_VERSION kubectl=$KUBE_VERSION ceph-common

# Setup machine
#
sysctl net.bridge.bridge-nf-call-iptables=1

# Setup machine for Perflab
#
if [ -z "$MASTER_IP" ]; then
    true # avoid 'if' empty block error.
    ###### VM and Kernel parameters - begin
    #sysctl -w vm.max_map_count=16000000
    #sysctl -w kernel.sched_latency_ns=60000000
    #sysctl -w kernel.sched_min_granularity_ns=15000000
    #sysctl -w kernel.sched_wakeup_granularity_ns=2000000
    #sysctl -w kernel.sched_migration_cost_ns=500000
    ###### VM and Kernel parameters - end

    ###### NVMe Drive tuning - begin
    ## Set scheduler to "none"
    #for i in `ls -d /sys/block/nvme*n*`; do echo none > ${i}/queue/scheduler; done

    ## nr_requests
    ## Current NVMe drives support a mack value of 1023.
    #for i in `ls -d /sys/block/nvme*n*`; do echo 1023  > ${i}/queue/nr_requests; done

    ## add_random
    #for i in `ls -d /sys/block/nvme*n*`; do echo 0 > ${i}/queue/add_random; done

    ## rq_affinity
    #for i in `ls -d /sys/block/nvme*n*`; do echo 1 > ${i}/queue/rq_affinity; done

    ## rotational
    #for i in `ls -d /sys/block/nvme*n*`; do echo 0 > ${i}/queue/rotational; done

    ## read_ahead_kb
    ## for i in `ls -d /sys/block/nvme*n*`; do cat ${i}/queue/read_ahead_kb; done
    ## Is current default of 128 for the NVMe drives good enough?
    ###### NVMe Drive tuning - end
fi

# Configure docker for perflab
if [ -z "$MASTER_IP" ]; then
    if [ ! -z "$DOCKER_DIR" ]; then
        #DOCKER_DIR_DEFAULT=/tmp/var/lib/docker
        DOCKER_DIR_DEFAULT=/var/lib/docker
        echo "Moving docker default $DOCKER_DIR_DEFAULT to folder: $DOCKER_DIR..."
        if [ -d "$DOCKER_DIR_DEFAULT" ]; then
            #cd /tmp
            cd /lib/systemd/system
            if [ ! -f "docker.service.org" ]; then
                cp docker.service docker.service.org
            fi
            if egrep -q "($DOCKER_DIR)" docker.service; then
                echo "docker configuration already set to $DOCKER_DIR"
            else
                systemctl stop docker
                rm -f docker.service.sed 2>/dev/null
                sed -r "s|dockerd |dockerd -g $DOCKER_DIR |" docker.service > docker.service.sed
                cp docker.service.sed docker.service
                if [ ! -z "$DOCKER_DIR_CLEAN" ]; then
                    echo "Cleaning Docker folder: $DOCKER_DIR"
                    if [ ! -z "$DOCKER_DIR" ]; then
                        if [ -f "$SCRIPT_DIR/nuke-graph-directory.sh" ]; then
                            $SCRIPT_DIR/nuke-graph-directory.sh $DOCKER_DIR
                        else
                            ( shopt -s dotglob; set -x; rm -rf "$DOCKER_DIR"/* )
                        fi
                    fi
                    mkdir -p $DOCKER_DIR
                    chmod 777 $DOCKER_DIR
                fi
                # We used to sync the prior docker folders under the new docker folder
                # but as we are re-deploying docker, this is not necessary.
                # rsync -aqxP $DOCKER_DIR_DEFAULT/* $DOCKER_DIR
                if [ -f "$SCRIPT_DIR/nuke-graph-directory.sh" ]; then
                    $SCRIPT_DIR/nuke-graph-directory.sh $DOCKER_DIR_DEFAULT
                else
                    ( shopt -s dotglob; set -x; rm -rf "$DOCKER_DIR_DEFAULT"/* )
                fi
                systemctl daemon-reload
                systemctl start docker
            fi
        fi
        echo "Moving docker default $DOCKER_DIR_DEFAULT to folder: $DOCKER_DIR...done."
    else
        echo "DOCKER_DIR not set."
    fi
fi

# Configure kubelet for perflab
if [ -z "$MASTER_IP" ]; then
    if [ ! -z "$KUBELET_DIR" ]; then
        #KUBELET_DIR_DEFAULT=/tmp/var/lib/kubelet
        #kubelet_conf_dirname=$( get_kubelet_configuration_file_dirname )
        kubelet_conf_dirname=/etc/default
        cd $kubelet_conf_dirname
	    if [ ! -f "kubelet" ]; then
		    echo -e "\e[41mkubelet doesn't seem installed. please correct...\e[0m"
	    else
        	KUBELET_DIR_DEFAULT=/var/lib/kubelet
        	echo "Moving kubelet default $KUBELET_DIR_DEFAULT to folder: $KUBELET_DIR..."
        	systemctl daemon-reload
        	systemctl stop kubelet
        	if [ ! -d "$KUBELET_DIR" ]; then
            		mkdir -p $KUBELET_DIR
            		chmod 777 $KUBELET_DIR
        	else
            		if [ ! -z "$KUBELET_DIR" ] && [ "$KUBELET_DIR" != "/" ]; then
            		    if [ -f "$SCRIPT_DIR/nuke-graph-directory.sh" ]; then
            		        $SCRIPT_DIR/nuke-graph-directory.sh $KUBELET_DIR
            		    else
            		        ( shopt -s dotglob; set -x; rm -rf "$KUBELET_DIR"/* )
            		    fi
            		fi
        	fi
        	if [ ! -f "kubelet.org" ]; then
            		cp kubelet kubelet.org
        	fi
        	if grep -q "$KUBELET_DIR" kubelet; then
            		echo "kubelet configuration already set to $KUBELET_DIR"
        	else
            		rm -f kubelet.sed 2>/dev/null
            		sed -r "s|KUBELET_EXTRA_ARGS=|KUBELET_EXTRA_ARGS=--root-dir=$KUBELET_DIR |" kubelet > kubelet.sed
            		cp kubelet.sed kubelet
        	fi
        	systemctl daemon-reload
        	systemctl start kubelet
        	echo "Moving kubelet default $KUBELET_DIR_DEFAULT to folder: $KUBELET_DIR...done."
	    fi
    else
        echo "KUBELET_DIR not set."
    fi
fi

