Project Sturcture
===

```
├── static
│   ├── buildfiles      # build files for build vue theme
│   │   ├── build.js
│   │   ├── check-versions.js
│   │   ├── dev-client.js
│   │   ├── dev-server.js
│   │   ├── utils.js
│   │   ├── vue-loader.conf.js
│   │   ├── webpack.base.conf.js
│   │   ├── webpack.dev.conf.js
│   │   └── webpack.prod.conf.js
│   ├── config
│   │   ├── dev.env.js
│   │   ├── index.js
│   │   ├── prod.env.js
│   │   └── test.env.js
│   ├── index.html      # origin html for insert built out js path
│   ├── login
│   │   ├── login.css
│   │   ├── login.less
│   │   └── particles.min.js
│   ├── package.json    # package requirement and scripts
│   └── src             # main source code for vue theme
│       ├── App.vue     # main app component
│       ├── api         # api files for communicate with backend service
│       │   ├── cluster.js
│       │   ├── host.js
│       │   ├── status.js
│       │   └── user.js
│       ├── components  # common components
│       │   ├── EChart.vue
│       │   ├── HeaderBar.vue
│       │   └── LeftNav.vue
│       ├── config      # global configuration
│       │   ├── Menus.js
│       │   └── Urls.js
│       ├── main.js     # app entry file
│       ├── pages       # all router pages
│       │   ├── Chains
│       │   │   ├── ChainModal.vue
│       │   │   ├── ExpandRow.vue
│       │   │   ├── Operation.vue
│       │   │   └── index.vue
│       │   ├── HomePage.vue
│       │   ├── Host
│       │   │   ├── HostModal.vue
│       │   │   ├── Operation.vue
│       │   │   └── index.vue
│       │   └── UserManagement
│       │       ├── Operation.vue
│       │       ├── UserModal.vue
│       │       └── index.vue
│       ├── router
│       │   └── index.js    # router configration file
│       └── store           # global storage files
│           ├── clusters.js
│           ├── hosts.js
│           ├── index.js
│           ├── stats.js
│           └── users.js
└── templates           # html files built out
    ├── index.html
    └── login.html
```

## static/build/

This directory holds the actual configurations for both the development server and the production webpack build. Normally you don't need to touch these files unless you want to customize Webpack loaders, in which case you should probably look at build/webpack.base.conf.js

## static/src/

This is where most of your application code will live in. How to structure everything inside this directory is largely up to you.

## static/index.html

This is the **template** index.html for our single page application. During development and builds, Webpack will generate assets, and the URLs for those generated assets will be automatically injected into this template to render the final HTML.

## static/package.json

The NPM package meta file that contains all the build dependencies and build commands.

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.    png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.