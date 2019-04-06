# Tool for manage cello resources

celloctl is a command line tool to manage resources in cello services, you can read the usage [document](celloctl.md).

## Config file for celloctl command

First, you need write the config file under $HOME/.cello or /etc/cello directory. The file format is like:

```yaml
auth:
  password: pass # user password
  username: admin # user name
server:
  url: http://127.0.0.1/engine # the api engine url of cello
```
