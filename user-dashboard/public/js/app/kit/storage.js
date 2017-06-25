
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

define(function() {
	function storage() {
		/**
		 * contractId_deploy (xxxx_deploy): [
		 * 		{
		 * 			func: xxxx,
		 * 			args: xxxx
		 * 		},
		 * 		{....}
		 * ]
		 * chainId_chaincodeId_invoke (xxxx_xxxx_invoke): [
		 * 		{
		 * 			func: xxxx,
		 * 			args: xxxx
		 * 		},
		 * 		{....}
		 * ]
		 * chainId_chaincodeId_query (xxxx_xxxx_query): [
		 * 		{
		 * 			func: xxxx,
		 * 			args: xxxx
		 * 		},
		 * 		{....}
		 * ]
		 */
	}
	storage.prototype = {
		save: function(type, key, item) {
			if (!localStorage.getItem(key + "_" + type)) {
				localStorage.setItem(key + "_" + type, JSON.stringify(item));
			}
		},
		get: function(type, key) {
			var item = localStorage.getItem(key + "_" + type);
			return JSON.parse(item);
		},
		set: function(type, key, item) {
			var items = this.get(type, key);
			for (var i=0; i<items.length; i++) {
				if (items[i].func == item.func) {
					items[i].args = item.args;
					break;
				}
			}
			if (i == items.length) {
				items.push(item);
			}
			localStorage.setItem(key + "_" + type, JSON.stringify(items));
		},
		remove: function(key) {
			var keys = [];
			for (var i=0; i<localStorage.length; i++) {
				var k = localStorage.key(i);
				if (k.split("_")[0] == key) {
					keys.push(k);
				}
			}
			for (var i in keys) {
				localStorage.removeItem(keys[i]);
			}
		}
	};
	return storage;
});