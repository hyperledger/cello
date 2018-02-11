** **This is another Front-end implementation for cello dashboard, if you want to use this version, must change the theme into reactjs.

How to start service with react theme?
--------------------------------------

```sh
$ THEME=react make start
```

If you want to develop original js code for react, you must install node modules, and rebuild js after you change the js code.

In the initialized state, must install node modules, the command is

```sh
$ make npm-install
```

If you want to add extra node modules, you need change the package.json file in src/themes/react/static directory, then rerun the command “make npm-install”.

How to build react js?
----------------------

In the development phase

```sh
$ make watch-mode
```

In the production environment

```sh
$ make build-js
```

<a rel="license" href="http://creativecommons.org/licenses/by/4.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by/4.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>.
