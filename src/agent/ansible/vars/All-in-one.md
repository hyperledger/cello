Run everything on an Ubuntu server

As a developer, you might like to run everything on one machine by following
the steps below to stand up a fabric network. At present, Ubuntu servers are
the target operating systems that Fabric uses. For any other operating
system, you may have to resolve some issues related to installation commands.
The following steps work on Ubuntu 17.04 server. If you are using a different
version of Ubuntu server, the steps should be very similar other than some
dependency differences; for example, earlier Ubuntu server versions do not
have git installed, so you may have to install git as well.

    1. Use a clean Ubuntu system, login as a user who can do `sudo su`
    without prompting password, and setup ssh and keys if you do not already
    have one.

        mkdir -p ~/.ssh && cd ~/.ssh && ssh-keygen -t rsa -f fd -P ""
        eval $(ssh-agent -s) && ssh-add ~/.ssh/fd

    The above commands created a key pair named fd and fd.pub. If you choose
    to use other names, you will need to make sure these names are used in
    vars/vb.yml and vars/bc2nd.yml file in steps below. Files vs.yml and
    bc2nd.yml use fd and fd.pub as the default value for ssh key pairs.

    2. Install necessary software and packages such as ansible and cello.

        sudo apt-get update
        sudo apt-get install python-dev python-pip libssl-dev libffi-dev -y
        sudo pip install ansible==2.3.0.0
        cd ~ && git clone https://gerrit.hyperledger.org/r/cello

    The above steps should install all necessary software and clone the cello
    project into your home directory.

    3. Create a runhosts file in ~/cello/src/agent/ansible/run directory

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

    You will have to replace the $ip with your own IP address to create a real
    runhosts file. Run the following commands to create the runhosts file
    for your environment.

        ipaddr=$(ip -4 addr show | awk -F '/' '/inet / {print $1}' | grep -v '127.0.0.1' | awk -F ' ' '{print $2;exit}')
        sed "s/\$ip/$ipaddr/g" run/runhosts.tpl > run/runhosts

    4. Then run the following two commands to stand up fabric network. If you
    are using different user id, then you will need to change the ssh_user in
    both vars/vb.yml and vars/vb1st.yml file to match your user id.

        ansible-playbook -i run/runhosts -e "mode=apply env=vb" initcluster.yml --skip-tags="resetconn"
        ansible-playbook -i run/runhosts -e "mode=apply env=bc2nd" setupfabric.yml

    5. To get rid of the fabric network, you can simply do the following:

        ansible-playbook -i run/runhosts -e "mode=destroy env=bc2nd" setupfabric.yml
        ansible-playbook -i run/runhosts -e "mode=destroy env=vb" initcluster.yml

    Notice that the commands are in reverse order of the commands in step #4.

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">
<img alt="Creative Commons License" style="border-width:0"
src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />
This work is licensed under a
<a rel="license" href="http://creativecommons.org/licenses/by/4.0/">
Creative Commons Attribution 4.0 International License</a>.