
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

define([
    "jquery",
	"cookie",
    "app/index/login",
    "uikit"
], function($, Cookies, login) {
    $(function() {
    	$("#signin").click(function() {
    		login.show();
    	});
    	$("#tryBtn").attr("disabled", false).click(function() {
    		if ($("#apikey").val() == "") {
    			login.show();
    		} else {
				var referer = Cookies.get("referer");
				Cookies.remove("referer");
    			$(this).attr("disabled", true).append($("<i class='uk-icon-spinner uk-icon-spin'></i>"));
    			$(location).attr("href", referer || "/dashboard");
    		}
    	});
    });
});