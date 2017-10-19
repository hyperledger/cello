
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/3.
 */
define([
    "jquery",
    "app/dashboard/profile",
    "plugin/text!resources/dashboard/home/costnotes.html",
    "uikit"
], function($, Profile, costnotes) {
    $(function() {
        new Profile();

        $("#bluepoints").on("click", function() {
            var $dialog = $(costnotes);
            $dialog.on({
                "hide.uk.modal": function() {
                    $(this).remove();
                }
            });
            $("body").append($dialog);
            var $costNotesDialog = UIkit.modal($dialog);
            $costNotesDialog.options.center = true;
            $costNotesDialog.show();
        });
    });
});