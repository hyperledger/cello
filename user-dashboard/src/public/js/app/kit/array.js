
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

define(function() {
	Object.defineProperty(Array.prototype, "extrude", {
		value: function(max, items) {
			if (!Array.isArray(items)) items = [items];
			if (this.length >= max) this.splice(0, items.length);
			for (var i in items) {
				this.push(items[i]);
			}
		},
		enumerable: false
	});
});