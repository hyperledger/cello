
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

define([
	"jquery",
	"plugin/text!resources/dashboard/overlay.html"
], function($, overlay) {
	function overlayer() {
		this.view = $(overlay);
		this.progressbar = this.view.find(".fullscreen-progress");
		this.loading = 0;
		this.timer = null;
	}
	overlayer.prototype = {
		show: function() {
			$("body").append(this.view);
			this.loading = 0;
			this.update();
		},
		hide: function() {
			if (this.timer) clearTimeout(this.timer);
			this.progressbar.animate({
				width: "100%"
			}, 250, function() {
				this.view.fadeOut(500, function() {
					$(this).remove();
				});
			}.bind(this));
		},
		update: function() {
			if (this.loading < 90) {
				this.loading += 10;
			} else {
				this.loading++;
			}
			if (this.timer) clearTimeout(this.timer);
			if (this.loading < 100) {
				this.progressbar.css("width", this.loading + "%");
				this.timer = setTimeout(function() {
					this.update();
				}.bind(this), this.loading * Math.round(50 * Math.random()));
			}
		}
	};
	return overlayer;
});