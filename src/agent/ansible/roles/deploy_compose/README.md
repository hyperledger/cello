Use docker compose to deploy fabric network

run this command::

   ansible-playbook -i vars/runhosts -e "mode=apply env=vb1st" setupfabric.yml

Make sure that these host machines are already up running, run the above
command to setup fabric network defined in vars/vb1st.yml file