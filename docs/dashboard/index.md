# Dashboard

The dashboard integrated operator & user control panel, limit the different pages that
can be accessed by user's permission.

The dashboard is written in react framework, and based on Ant design Pro UI framework.

## How to startup dashboard

For developer, if you want to develop dashboard, can start dashboard in dev mode.

There are two options for start dashboard in dev mode, which are mock/no-mock.

First, need install required packages for dashboard.

```bash
$ cd src/dashboard && npm i
```

### Start dashboard with mock api

```bash
$ make start-dashboard-dev
```

### Start dashboard with real api-engine server

```bash
$ MOCK=False PROXY=http://api-engine-server/engine make start-dashboard-dev
```
