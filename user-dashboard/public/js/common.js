requirejs.config({
	baseUrl: "/js",
	waitSeconds: 0,
	urlArgs: "bust=" + (new Date()).getTime(),
	paths: {
		"jquery": "lib/jquery",
		"uikit": "lib/uikit",
		"plugin": "lib/components",
		"ol": "lib/ol",
		"three": "lib/three",
		"tween.min": "lib/tween.min",
		"CSS3DRenderer": "lib/CSS3DRenderer",
		"TrackballControls": "lib/TrackballControls",
		"lodash": "lib/lodash",
		"echarts": "lib/echarts",
		"cookie": "lib/js.cookie"
	},
	shim: {
		"uikit": ["jquery"],
		"plugin/notify": ["uikit"],
		"plugin/tooltip": ["uikit"],
		"plugin/upload": ["uikit"],
		"plugin/sticky": ["uikit"],
		"plugin/pagination": ["uikit"],
		"CSS3DRenderer": ["three"],
		"TrackballControls": ["three"],
		"tween.min": {
			deps: ["three"],
			exports: "TWEEN"
		}
	}
});