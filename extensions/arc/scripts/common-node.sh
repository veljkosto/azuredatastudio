#!/bin/bash

#
# This script exports common functions to deployment scripts.
# First, in consideration of deployments in the perflab.
#

function is_root
{
	is_root_set=0
	if [ "$EUID" -ne 0 ]; then
  	    echo "Please run as root"
    else
        is_root_set=1
	fi
    return $is_root_set
}

function get_os
{
    local OS=`lsb_release -ds 2>/dev/null || cat /etc/*release 2>/dev/null | head -n1 || uname -om`
    echo $OS
}

function get_kubelet_configuration_file
{
#   local kubelet_conf=/tmp/kubelet
    local kubelet_conf=/etc/default/kubelet
    local os=$( get_os )
    if `echo "$os" | egrep -q -i "red|centos"`; then
	    kubelet_conf=/etc/sysconfig/kubelet
    fi
    echo $kubelet_conf
}

function get_kubelet_configuration_file_dirname
{
    local kubelet_conf=$( get_kubelet_configuration_file )
    echo $( dirname "${kubelet_conf}" )
}

function get_kubelet_directory_from_configuration0
{
    local kubelet_conf=/etc/default/kubelet
    local kubelet_dir=""
    local os=$( get_os )
    if `echo "$os" | egrep -q -i "red|centos"`; then
	    kubelet_conf=/etc/sysconfig/kubelet
    fi
    kubelet_dir=`cat $kubelet_conf 2>/dev/null | gawk -F "--root-dir=" '{print $2}' | gawk -F " " '{print $1}'`
    echo $kubelet_dir
}

function get_kubelet_directory_from_configuration
{
    local kubelet_dir=`cat $( get_kubelet_configuration_file ) 2>/dev/null | gawk -F "--root-dir=" '{print $2}' | gawk -F " " '{print $1}'`
    echo $kubelet_dir
}

