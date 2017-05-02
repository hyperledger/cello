define([
    "jquery",
    "app/index/login",
    "uikit"
], function($, login) {
    $(function() {
    	$("#signin").click(function() {
    		login.show();
    	});
    	$("#tryBtn").attr("disabled", false).click(function() {
    		if ($("#apikey").val() == "") {
    			login.show();
    		} else {
    			$(this).attr("disabled", true).append($("<i class='uk-icon-spinner uk-icon-spin'></i>"));
    			$(location).attr("href", "/bc/dashboard");
    		}
    	});
    });
});