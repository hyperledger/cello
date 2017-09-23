#Monitoring services

The monitoring services build in real time an archive of observations obtained from the analisys of the communication flows of the Cello application services.

The observations could be checked in real time (directly in memory) against attacks, anomalies or errors.

The observations, once processed in real time, are stored into a persistent archive for statistic analisys and reports generation.

### Config the port to be monitored
Admin can configure the tcp ports to be monitored by the monitoring services, by adding the following two lines:

```bash
# the monitoring services will have to monitor the following ports
PORTS_TO_BE_MONITORED = list(PEER_SERVICE_PORTS.items()) + list(CA_SERVICE_PORTS.items())
to the configuration file: /src/common/utils.py
```

### Config the monitoring level
Admin can add to the file /src/monitoring/config.py the following flags:

* MONITOR_DB=[file name or network path where to store the persistent archive]
* MONITOR_LEVEL=FULL | SIMPLE | NONE

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.