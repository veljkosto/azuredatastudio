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

# Setup cluster
#
kubeadm init --config /tmp/kubeadm-init-args.conf

# Configure the user to access the cluster
#
mkdir -p $HOME/.kube

# copy the kube config and simplitfy the admin user name too
#
cat /etc/kubernetes/admin.conf | sed 's/kubernetes-admin/kubeadmin/g' > $HOME/.kube/config
chown $(id -u $SUDO_USER):$(id -g $SUDO_USER) $HOME/.kube/config

# To enable a single node cluster remove the taint that limits the first node to master only services
#
master_node=`kubectl get nodes --no-headers=true --output=custom-columns=NAME:.metadata.name`
kubectl taint nodes ${master_node} node-role.kubernetes.io/master:NoSchedule-

# Label the node if a label was included
#
if [ ${NODE_LABEL} ]
then
    kubectl label node ${master_node} mssql-cluster-wide=${NODE_LABEL}
fi

# Install software defined network
#
kubectl apply -f $SCRIPT_DIR/kube-flannel.yml

# Changes related to security policy
#

# Introducing a switch to ease migration towards secure kubernetes
#
if [ "$ENABLE_PSP" == "1" ]; then
    # Create policies and role/bindings for them: starting with privileged first
    #
    kubectl apply -f $SCRIPT_DIR/policy/privileged-psp.yaml
    kubectl create clusterrole privileged-user --verb=use --resource=podsecuritypolicy --resource-name=privileged
    kubectl create rolebinding kube-system:privileged-user -n kube-system --clusterrole privileged-user --group system:nodes --group system:serviceaccounts:kube-system
    kubectl create rolebinding kubeadmin:privileged-user --clusterrole privileged-user --user kubeadmin

    kubectl apply -f $SCRIPT_DIR/policy/restricted-psp.yaml
    kubectl create clusterrole restricted-user --verb=use --resource=podsecuritypolicy --resource-name=restricted
    kubectl create clusterrolebinding all:restricted-user --clusterrole restricted-user --group system:serviceaccounts --group system:authenticated

    # Create a kubeuser to be used as a per-namespace admin user
    #
    kubeadm alpha kubeconfig user --client-name=kubeuser > ./temp-kubeconf
    KUBECONFIG=~/.kube/config:/tmp/config2 kubectl config view --flatten > ./temp-kubeconf
    mv ~/.kube/config ~/.kube/config.bak
    mv ./temp-kubeconf ~/.kube/config

    # Enable the Admissions Controller and wait for the ApiServer to recycle
    #
    sed -i 's/\(--enable-admission-plugins=.*\)/\1,PodSecurityPolicy/' /etc/kubernetes/manifests/kube-apiserver.yaml
fi

# Here we need to give access to the original user
# considering that this script runs under sudo
#
ME=$(logname 2>/dev/null || echo $SUDO_USER)
chown ${ME} -R ~/.kube

#
# End of changes for security policy

echo
echo "Cluster initialization complete. You do NOT have to do the above steps, script already does it for you. You are welcome!"
echo

# Verify that the cluster is ready to be used
#
TIMEOUT=120
echo "Verifying that the cluster is ready for use..."
while true ; do

    if [ "$TIMEOUT" -le 0 ]; then
        echo "Cluster node failed to reach the 'Ready' state. Kubeadm setup failed."
        exit 1
    fi

    status=`kubectl get nodes --no-headers=true | awk '{print $2}'`

    if [ "$status" == "Ready" ]; then
        break
    fi

    sleep "$RETRY_INTERVAL"

    TIMEOUT=$(($TIMEOUT-$RETRY_INTERVAL))

    echo "Cluster not ready. Retrying..."
done

echo
echo "Your local kubernetes cluster is now ready to use. Try running \"kubectl get nodes\""
echo
