
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

define(["ol"], function(ol) {
	function common() {
		this.nodeDetailPopup = null;
	}
	common.prototype = {
		pan2Viewport: function(map) {
			var size = map.getSize();
    		var width = size[0], height = size[1];
    		
    		var view = map.getView();
    		var resolution = view.getResolution();
    		var center = view.getCenter();
    		var x = center[0], y = center[1];
    		var horizontalDis = x / resolution, verticalDis = y / resolution;
    		
    		//horizontal
    		if (horizontalDis + width / 2 >= width) {
    			//vertical
    			if (verticalDis + height / 2 >= height) {
    				view.setCenter([width / 2 * resolution, height / 2 * resolution]);
    			} else if (verticalDis - height / 2 <= height * (-1)) {
    				view.setCenter([width / 2 * resolution, height / 2 * resolution * (-1)]);
    			} else {
    				view.setCenter([width / 2 * resolution, y]);
    			}
    		} else if (horizontalDis - width / 2 <= width * (-1)) {
    			//vertical
    			if (verticalDis + height / 2 >= height) {
    				view.setCenter([width / 2 * resolution * (-1), height / 2 * resolution]);
    			} else if (verticalDis - height / 2 <= height * (-1)) {
    				view.setCenter([width / 2 * resolution * (-1), height / 2 * resolution * (-1)]);
    			} else {
    				view.setCenter([width / 2 * resolution * (-1), y]);
    			}
    		} else {
    			//vertical
    			if (verticalDis + height / 2 >= height) {
    				view.setCenter([x, height / 2 * resolution]);
    			} else if (verticalDis - height / 2 <= height * (-1)) {
    				view.setCenter([x, height / 2 * resolution * (-1)]);
    			}
    		}
		},
		showNodeDetail: function(map, geometry, property) {
			this.hideNodeDetail(map);
			var pos = geometry.getCoordinates();
    		var offsetX = property.type == "v" ? 40 : 30;
    		var detailInfo = "Node ID: " + property.id + "<br>" +
							 "Type: " + (property.type == "v" ? "Validation Node" : "Non-validation Node");
    		var $element = $("<div class='nodeDetail'>" + detailInfo + "</div>");
    		this.nodeDetailPopup = new ol.Overlay({
				element: $element[0],
				offset: [offsetX, -20],
				insertFirst: false
    		});
    		map.addOverlay(this.nodeDetailPopup);
			this.nodeDetailPopup.setPosition(pos);
		},
		hideNodeDetail: function(map) {
    		if (this.nodeDetailPopup != null) {
				map.removeOverlay(this.nodeDetailPopup);
				this.nodeDetailPopup = null;
			}
		},
		uuid: function() {
			var s = [];
			var hexDigits = "0123456789abcdef";
			for (var i=0; i<36; i++) {
				s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
			}
			s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
			s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
			s[8] = s[13] = s[18] = s[23] = "-";
			
			var uuid = s.join("");
			return uuid;
		},
		parseHash: function(hash) {
			var state = null;
			if (hash) {
				hash = hash.substring(hash.indexOf("#") + 1);
				if (hash.indexOf("-") >= 0) {
					if (hash.indexOf("/") >= 0) {
						state = {
							navigation: hash.substring(0, hash.indexOf("-")),
							section: hash.substring(0, hash.indexOf("/")),
							param: { chain_id: hash.substring(hash.indexOf("/") + 1) }
						}
					} else {
						state = {
							navigation: hash.substring(0, hash.indexOf("-")),
							section: hash
						};
					}
				} else {
					state = {
						navigation: hash,
						section: hash
					};
				}
			}
			return state;
		},
		min: function(arr) {
			if (!Array.isArray(arr)) throw "Only accept array.";
			if (arr.length == 1) return arr[0];
			var min = Number.MAX_VALUE;
			for (var i=0; i<arr.length; i++) {
				if (arr[i] != 0 && arr[i] < min) {
					min = arr[i];
				}
			}
			return min;
		},
		getBytesUnit: function(bytesArray) {
			var KB = 1024, MB = 1048576, GB = 1073741824;
			var _min = this.min(bytesArray);
			if (_min < KB) {
				return "B";
			} else if (_min < MB) {
				return "KB";
			} else if (_min < GB) {
				return "MB";
			} else {
				return "GB";
			}
		},
		scaleBytes: function(bytes, unit) {
			var KB = 1024, MB = 1048576, GB = 1073741824;
			if (unit == "KB") {
				return (bytes / KB).toFixed(2);
			} else if (unit == "MB") {
				return (bytes / MB).toFixed(2);
			} else if (unit == "GB") {
				return (bytes / GB).toFixed(2);
			} else {
				return bytes;
			}
		},
		parseBytes: function(bytes) {
			var KB = 1024, MB = 1048576, GB = 1073741824;
			if (bytes < KB) {
				return bytes + "B";
			} else if (bytes < MB) {
				return (bytes / KB).toFixed(2) + "KB";
			} else if (bytes < GB) {
				return (bytes / MB).toFixed(2) + "MB";
			} else {
				return (bytes / GB).toFixed(2) + "GB";
			}
		},
		parseJSON: function(str) {
			try {
				var o = JSON.parse(str);
				if (o && typeof o === "object") {
		            return o;
		        }
			} catch (err) {}
			return false;
		},
		parseTime: function(time) {
			if (time < 60) {
				return Math.round(time) + "s";
			} else if (time >= 60 && time < 3600) {
				var minute = Math.floor(time / 60);
				var second = Math.floor(time % 60);
				if (second == 0) return minute + "m";
				else return minute + "m " + second + "s";
			} else if (time >= 3600 && time < 3600 * 24) {
				var hour = Math.floor(time / 3600);
				var remain = Math.floor(time % 3600);
				if (remain >= 60) {
					var minute = Math.floor(remain / 60);
					return hour + "h " + minute + "m";
				} else {
					return hour + "h";
				}
			} else {
				var day = Math.floor(time / (3600 * 24));
				var remain = Math.floor(time % (3600 * 24));
				if (remain >= 3600) {
					var hour = Math.floor(remain / 3600);
					return day + "d " + hour + "h";
				} else if (remain >= 60) {
					var minute = Math.floor(remain / 60);
					return day + "d " + minute + "m";
				} else {
					return day + "d";
				}
			}
		}
	};
	return common;
});