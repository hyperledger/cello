
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

define([
	"jquery",
	"cookie",
	"app/kit/ui",
	"plugin/text!resources/dashboard/profile.html"
], function($, Cookies, UI, profiledialog) {
	var ui = new UI();
	var $dialog;
	var $profileDialog;
	var $profileName;
	var $profileEmail;
	var $profileBio;
	var $profileUrl;
	var $profileLocation;
	var $profileUpdate;
	var $profileCancel;
	
	function profile() {
		var _self = this;
		$("#profile").click(function() {
			$(this).parents(".uk-dropdown").hide();
			_self.show();
		});
		function disableAllElement(disabled) {
			if (disabled) {
				$profileDialog.options.bgclose = false;
			} else {
				$profileDialog.options.bgclose = true;
			}
			$profileName.attr("disabled", disabled);
			$profileEmail.attr("disabled", disabled);
			$profileBio.attr("disabled", disabled);
			$profileUrl.attr("disabled", disabled);
			$profileLocation.attr("disabled", disabled);
			$profileUpdate.attr("disabled", disabled);
			$profileCancel.attr("disabled", disabled);
		}
		function loadProfile() {
			disableAllElement(true);
			var userInfo = Cookies.getJSON("BlockChainAccount");
			$.ajax({
				type: "GET",
				url: "/api/" + userInfo.apikey + "/profile/",
				dataType: "json",
				success: function(data) {
					disableAllElement(false);
					if (data.success) {
						$profileName.val(data.result.name || userInfo.username.split("@")[0]);
						$profileEmail.val(data.result.email || userInfo.username);
						$profileBio.val(data.result.bio);
						$profileUrl.val(data.result.url);
						$profileLocation.val(data.result.location);
					} else {
						ui.dialog.error(data.message);
					}
				},
				error: function(XMLHttpRequest, textStatus, errorThrown) {
					disableAllElement(false);
    				ui.dialog.error(errorThrown);
				}
			});
		}
		this.init = function() {
			$profileName = $("#profile_name");
			$profileEmail = $("#profile_email");
			$profileBio = $("#profile_bio");
			$profileUrl = $("#profile_url");
			$profileLocation = $("#profile_location");
			$profileUpdate = $("#profile_update");
			$profileCancel = $("#profile_cancel");

			loadProfile();
			
			$profileUpdate.on("click", function() {
				if ($profileName.val() == "") {
					ui.dialog.warning("Please input your name.");
					$profileName.focus();
					return;
				}
				if ($profileEmail.val() == "") {
					ui.dialog.warning("Please input your email.");
					$profileEmail.focus();
					return;
				}
				var $spinner = $("<i class='uk-icon-spinner uk-icon-spin'></i>");
	    		disableAllElement(true);
	    		$(this).append($spinner);
				var userInfo = Cookies.getJSON("BlockChainAccount");
	    		$.ajax({
	    			type: "POST",
	    			url: "/api/" + userInfo.apikey + "/profile/update",
	    			data: {
	    				name: $profileName.val(),
	    				email: $profileEmail.val(),
	    				bio: $profileBio.val(),
	    				url: $profileUrl.val(),
	    				location: $profileLocation.val()
	    			},
	    			dataType: "json",
	    			success: function(data) {
	    				$spinner.remove();
	    				disableAllElement(false);
	    				if (data.success) {
	    					$("#welcomeInfo").html($profileName.val());
	    					$profileDialog.hide();
	    					ui.dialog.success("Update successfully.", 3000);
	    				} else {
	    					ui.dialog.error(data.message);
	    				}
	    			},
	    			error: function(XMLHttpRequest, textStatus, errorThrown) {
	    				$spinner.remove();
	    				disableAllElement(false);
	    				ui.dialog.error(errorThrown);
	    			}
	    		});
			});
			$profileCancel.on("click", function() {
				$profileDialog.hide();
			});
		}
	}
	profile.prototype = {
		show: function() {
			var _self = this;
			$dialog = $(profiledialog);
			$dialog.on({
				"show.uk.modal": function() {
					_self.init();
				},
				"hide.uk.modal": function() {
					$(this).remove();
				}
			});
			$("body").append($dialog);
			$profileDialog = UIkit.modal($dialog);
			$profileDialog.show();
		}
	};
	return profile;
});