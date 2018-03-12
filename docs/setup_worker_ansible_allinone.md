# Run everything on one clean Ubuntu server

As a developer, you might like to run everything on one machine by following
the steps below to stand up a fabric network. At present, Ubuntu servers are
the target operating systems that Fabric uses. For any other operating
system, you may have to resolve some issues related to installation commands.
The following steps work on Ubuntu 17.04 server. If you are using a different
version of Ubuntu server, the steps should be very similar other than some
dependency differences; for example, earlier Ubuntu server versions do not
have git installed, so you may have to install git as well.

Please follow the below steps to stand up an all-in-one fabric system

## Install dependencies and clone cello

Use a clean Ubuntu system, login as a user who can do `sudo su` without
prompting password, and run the following commands to install necessary
dependencies, grant current user docker permissions and clone the cello
project into the current user home directory::

        sudo apt-get update
        sudo apt-get install python-dev python-pip libssl-dev libffi-dev docker.io -y
        sudo pip install 'ansible>=2.3.0.0'
        sudo gpasswd -a $USER docker
        cd ~ && git clone https://gerrit.hyperledger.org/r/cello

## Setup ssh key pair and key ssh login

        mkdir -p ~/.ssh && cd ~/.ssh && ssh-keygen -t rsa -f fd -P ""
        cat ~/.ssh/fd.pub >> ~/.ssh/authorized_keys

The above commands create a key pair named fd and fd.pub. If you choose
to use other names, you will need to make sure these names are used in
~/cello/src/agent/ansible/vars/vb.yml and bc2nd.yml file in steps below.
Files vb.yml and bc2nd.yml use fd and fd.pub as the default value for ssh
key pairs.

## Log out, log back in and setup ssh agent

        eval $(ssh-agent -s) && ssh-add ~/.ssh/fd

The above command create a ssh-agent so that you do not have to provide
ssh keys in your current session when you try to establish a ssh connection,
Notice that this only establish a ssh-agent for current session. If you log
out and back in, you will have to run the above command again.


## Create runhosts file

Create a run directory ~/cello/src/agent/ansible

        mkdir -p ~/cello/src/agent/ansible/run

Create file ~/cello/src/agent/ansible/run/runhosts.tpl with the following content

        cloud ansible_host=127.0.0.1 ansible_python_interpreter=python
        $ip private_ip=$ip public_ip=$ip inter_name=fabric001

        [allnodes]
        $ip

        [etcdnodes]
        $ip

        [builders]
        $ip

Change your working directory to ~/cello/src/agent/ansible and run the
following commands to create runhosts file for your environment.

        ipaddr=$(ip -4 addr show | awk -F '/' '/inet / {print $1}' | grep -v '127.0.0.1' | awk -F ' ' '{print $2;exit}')
        sed "s/\$ip/$ipaddr/g" run/runhosts.tpl > run/runhosts

## Stand up the fabric network

Then run the following two commands to stand up fabric network. If you are
using different user id, then you will need to change the ssh_user in both
vb.yml and vb2nd.yml file in ~/cello/src/agent/ansible directory to match
your user id::

        ansible-playbook -i run/runhosts -e "mode=apply env=vb" initcluster.yml --skip-tags="resetconn"
        ansible-playbook -i run/runhosts -e "mode=apply env=bc2nd" setupfabric.yml

## Destroy the fabric network

To get rid of the fabric network, you can simply do the following:

        ansible-playbook -i run/runhosts -e "mode=destroy env=bc2nd" setupfabric.yml
        ansible-playbook -i run/runhosts -e "mode=destroy env=vb" initcluster.yml

Notice that the commands are in reverse order of the commands in previous step.

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">
<img alt="Creative Commons License" style="border-width:0"
src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />
This work is licensed under a
<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">
Creative Commons Attribution 4.0 International License</a>.
