define([
    "jquery",
    "app/kit/ui",
    "plugin/text!resources/index/logindialog.html",
    "plugin/text!resources/index/userinfo.html",
    "lodash"
], function($, UI, loginDialog, userInfo) {
	var ui = new UI();
	var $sign = $("#sign");
	
	var $loginDialog;
	var $loginForm;
	var $loginEmail;
	var $loginPassword;
	var $loginRememberme;
	var $registerLink;
	var $loginBtn;
	var $registerForm;
	var $registerEmail;
	var $registerPassword;
	var $registerRePassword;
	var $termofuse;
	var $registerBtn;
	
	function disableAllElement(disabled) {
		if (disabled) {
			$loginDialog.options.bgclose = false;
		} else {
			$loginDialog.options.bgclose = true;
		}
		$loginEmail.attr("disabled", disabled);
		$loginPassword.attr("disabled", disabled);
		$loginRememberme.attr("disabled", disabled);
		if (disabled) {
			$registerLink.off("click");
		} else {
			$registerLink.off().on("click", showRegisterForm);
		}
		$loginBtn.attr("disabled", disabled);
		$registerEmail.attr("disabled", disabled);
		$registerPassword.attr("disabled", disabled);
		$registerRePassword.attr("disabled", disabled);
		$termofuse.attr("disabled", disabled);
		$registerBtn.attr("disabled", disabled);
	}
	function showRegisterForm() {
		$loginForm.fadeOut("fast", function() {
			$registerForm.show();
			var height = $registerForm.height();
			$registerForm.css({
				marginTop: -height,
				height: height
			}).animate({
				marginTop: 0,
				height: height
			}, "fast");
		});
	}
	function init() {
		$loginForm = $("#loginForm");
		$loginEmail = $("#form-email");
		$loginPassword = $("#form-pwd");
		$loginRememberme = $("#form-rememberme");
		$registerLink = $("#register-link");
		$loginBtn = $("#login-btn");
		$registerForm = $("#registerForm");
		$registerEmail = $("#reg-email");
		$registerPassword = $("#reg-pwd");
		$registerRePassword = $("#reg-re-pwd");
		$termofuse = $("#termofuse");
		$registerBtn = $("#register-btn");
		
		$registerLink.click(function() {
			showRegisterForm();
		});
		$loginBtn.click(function() {
			if ($loginEmail.val() == "") {
    			ui.dialog.warning("Please input the email.");
				$loginEmail.focus();
				return;
    		} else if ($loginPassword.val() == "") {
    			ui.dialog.warning("Please input the password.");
				$loginPassword.focus();
				return;
    		}
    		var $spinner = $("<i class='uk-icon-spinner uk-icon-spin'></i>");
    		disableAllElement(true);
    		$(this).append($spinner);
    		$.ajax({
    			type: "POST",
    			url: "/bc/api/login",
    			data: {
    				username: $loginEmail.val(),
    				password: $loginPassword.val(),
    				rememberme: $loginRememberme.prop("checked")
    			},
    			dataType: "json",
    			success: function(data) {
    				$spinner.remove();
    				disableAllElement(false);
    				if (data.success) {
    					var userinfo = _.template(userInfo)({
    						activated: data.isActivated,
    						username: data.username
    					});
    					$sign.empty();
    					$sign.append(userinfo);
    					$("#apikey").val(data.apikey);
    					$loginDialog.hide();
    				} else {
    					ui.dialog.error(data.message, 3000);
    				}
    			},
    			error: function(XMLHttpRequest, textStatus, errorThrown) {
    				$spinner.remove();
    				disableAllElement(false);
    				ui.dialog.error(errorThrown);
    			}
    		});
		});
    	$termofuse.click(function() {
    		$registerBtn.attr("disabled", !$(this).prop("checked"));
    	});
    	$registerBtn.click(function() {
    		if ($registerEmail.val() == "") {
    			ui.dialog.warning("Please input the email.");
				$registerEmail.focus();
				return;
    		} else if ($registerPassword.val() == "") {
    			ui.dialog.warning("Please input the password.");
				$registerPassword.focus();
				return;
    		} else if ($registerRePassword.val() == "") {
    			ui.dialog.warning("Please retype the password.");
				$registerRePassword.focus();
				return;
    		} else if ($registerPassword.val() != $registerRePassword.val()) {
    			ui.dialog.warning("Please confirm the password.");
				$registerRePassword.focus();
				return;
    		}
    		var $spinner = $("<i class='uk-icon-spinner uk-icon-spin'></i>");
    		disableAllElement(true);
    		$(this).append($spinner);
    		$.ajax({
    			type: "POST",
    			url: "/bc/api/register",
    			data: {
    				username: $registerEmail.val(),
    				password: $registerPassword.val()
    			},
    			dataType: "json",
    			success: function(data) {
    				$spinner.remove();
    				disableAllElement(false);
    				if (data.success) {
    					var userinfo = _.template(userInfo)({
    						activated: data.isActivated,
    						username: data.username
    					});
						$sign.empty();
    					$sign.append(userinfo);
    					$("#apikey").val(data.apikey);
    					$loginDialog.hide();
    				} else {
    					ui.dialog.error(data.message, 3000);
    				}
    			},
    			error: function(XMLHttpRequest, textStatus, errorThrown) {
    				$spinner.remove();
    				disableAllElement(false);
    				ui.dialog.error(errorThrown);
    			}
    		});
    	});
	}
	return {
		show: function() {
			var $dialog = $(loginDialog);
			$dialog.on({
				"show.uk.modal": function() {
					init();
				},
				"hide.uk.modal": function() {
					$(this).remove();
				}
			});
			$("body").append($dialog);
			$loginDialog = UIkit.modal($dialog);
			$loginDialog.options.center = true;
			$loginDialog.show();
		}
	};
});