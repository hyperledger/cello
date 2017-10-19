
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

define(["jquery"], function($) {
	var $topology;
	var $log;
	var $blocks;
	var $apis;
	function scrollspy() {
		$topology = $(".ico3");
		$log = $(".ico4");
		$blocks = $(".ico5");
		$apis = $(".ico6");
		
		this.highlightTopo = function(highlight) {
			if (highlight) {
				$topology.css({
					color: "#00aaff",
					background: "url(/images/icon-topo-highlight.png) no-repeat center 0"
				});
			} else {
				$topology.css({
					color: "#07d",
					background: "url(/images/icon-topo.png) no-repeat center 0"
				});
			}
		}
		this.highlightLog = function(highlight) {
			if (highlight) {
				$log.css({
					color: "#00aaff",
					background: "url(/images/icon-log-highlight.png) no-repeat center 0"
				});
			} else {
				$log.css({
					color: "#07d",
					background: "url(/images/icon-log.png) no-repeat center 0"
				});
			}
		}
		this.highlightBlocks = function(highlight) {
			if (highlight) {
				$blocks.css({
					color: "#00aaff",
					background: "url(/images/icon-bc-highlight.png) no-repeat center 0"
				});
			} else {
				$blocks.css({
					color: "#07d",
					background: "url(/images/icon-bc.png) no-repeat center 0"
				});
			}
		}
		this.highlightAPIs = function(highlight) {
			if (highlight) {
				$apis.css({
					color: "#00aaff",
					background: "url(/images/icon-apis-highlight.png) no-repeat center 0"
				});
			} else {
				$apis.css({
					color: "#07d",
					background: "url(/images/icon-apis.png) no-repeat center 0"
				});
			}
		}
	}
	scrollspy.prototype = {
		select: function(item, show) {
			switch (item) {
				case "topology":
					show ? this.highlightTopo(true) : this.highlightTopo(false);
					break;
				case "log":
					show ? this.highlightLog(true) : this.highlightLog(false);
					break;
				case "blocks":
					show ? this.highlightBlocks(true) : this.highlightBlocks(false);
					break;
				case "apis":
					show ? this.highlightAPIs(true): this.highlightAPIs(false);
					break;
			}
		}
	};
	return scrollspy;
});