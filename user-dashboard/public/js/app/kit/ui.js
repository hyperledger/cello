define([
	"plugin/notify",
	"plugin/upload",
	"plugin/tooltip",
	"plugin/sticky",
	"plugin/pagination"
], function() {
	function Dialog() {}
	Dialog.prototype = {
		warning: function(message, timeout) {
			timeout = timeout === 0 ? timeout : timeout || 3000;
			UIkit.notify({
				message: "<i class='uk-icon-warning'></i> " + message,
				status: "warning",
				timeout: timeout,
				pos: "top-center"
			});
		},
		error: function(message, timeout) {
			timeout = timeout === 0 ? timeout : timeout || 3000;
			UIkit.notify({
				message: "<i class='uk-icon-times-circle'></i> " + message,
				status: "danger",
				timeout: timeout,
				pos: "top-center"
			});
		},
		success: function(message, timeout) {
			timeout = timeout === 0 ? timeout : timeout || 3000;
			UIkit.notify({
				message: "<i class='uk-icon-check'></i> " + message,
				status: "success",
				timeout: timeout,
				pos: "top-center"
			});
		},
		info: function(message, timeout) {
			timeout = timeout === 0 ? timeout : timeout || 3000;
			UIkit.notify({
				message: "<i class='uk-icon-check'></i> " + message,
				status: "info",
				timeout: timeout,
				pos: "top-center"
			});
		}
	};
	function Uploader() {}
	Uploader.prototype = {
		upload: function($file, settings) {
			UIkit.uploadSelect($file, settings);
		}
	};
	function ui() {
		this.dialog = new Dialog();
		this.uploader = new Uploader();
	}
	return ui;
});