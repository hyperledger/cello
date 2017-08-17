Provision VMs against Virtual Box

This role provisions virtual machines from a virtual box system which allows running
VBoxManage command. To use this role, you will need to make sure that the system where
virtual box vms will be created is ssh enabled and can be accessed either using the
user name and password pair or using the ssh keys. You will also need to make sure
that there is an ubuntu 16.04 image on your current virtual box environment which
can be used to clone new machines. The image should have both python 2.x and docker
already installed. The configuration file is in vars/vb.yml. You should create your
own configuration file by copy and change that file according to your own environment.

To use this role to provision VirtualBxo vms once you create a configuration file like
vars/vb.yml, and named it myvb.yml, you can run the following command in the root
directory of the project, not in the directory where this file is located::

    ansible-playbook -e "mode=apply env=myvb cloud_type=vb password=xxxxx" procluster.yml

Replace the xxxxx in the command with your VirtualBox environment password, the user
id should be configured in the auth section in the vars/myvb.yml file.

To remove all these VMs, you can run the following command which will stop all the
vms and completely remove these vms from your VirtualBox environment::

    ansible-playbook -e "mode=destroy env=myvb cloud_type=vb password=xxxxx" procluster.yml

Few words about the base image::
The base image should have the ssh user be a sudoer, for example if your ssh user
is called ubuntu, do the following::

    echo "ubuntu ALL=(ALL) NOPASSWD: ALL" | sudo tee /etc/sudoers.d/ununtu

You may also want to disable the daily update which by default is enabled. When
you start a VB instance using the base image, if it starts auto update, your ansible
script will not be able to install any onto the instance. When you build your
base image, it will be nice to do apt update, then disable the daily updates. Also
make sure that the image can be ssh log in using username and password.

Currently this provision only support VirtualBox running on linux like system. When
you have VirtualBox running on Windows, the provision won't work. You will have to
manually create the VMs and run/hosts file like the following::

    cloud ansible_host=127.0.0.1 ansible_python_interpreter=python
    192.168.56.34 private_ip=192.168.56.34 public_ip=192.168.56.34 inter_name=fabric001
    192.168.56.36 private_ip=192.168.56.36 public_ip=192.168.56.36 inter_name=fabric002

    [allnodes]
    192.168.56.34
    192.168.56.36

    [etcdnodes]
    192.168.56.34

    [builders]
    192.168.56.34