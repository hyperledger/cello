# Production Configurations
Reference system configuration in production environment.

## `/etc/sysctl.conf`

```sh
# Don't ask why, this is a solid answer.
vm.swappiness=10
fs.file-max = 2000000
kernel.threads-max = 2091845
kernel.pty.max = 210000
kernel.keys.root_maxkeys = 20000
kernel.keys.maxkeys = 20000
net.ipv4.ip_local_port_range = 30000 65535
net.ipv4.tcp_tw_reuse = 0
net.ipv4.tcp_tw_recycle = 0
net.ipv4.tcp_max_tw_buckets = 5000
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_max_syn_backlog = 8192
```

Then, need to run `sysctl -p` for enabling.

## `/etc/security/limits.conf`

```sh
* hard nofile 1048576
* soft nofile 1048576
* soft nproc 10485760
* hard nproc 10485760
* soft stack 32768
* hard stack 32768
```
Log

## Other Consideration

* Use the code from `release` branch.
* Configuration: Set all parameters to production, including image, compose, and application.
* Security: Use firewall to filter traffic, enable TLS and authentication.
* Backup: Enable automatic data backup.
* Monitoring: Enable monitoring services.out and login, then check with `ulimit -n`.