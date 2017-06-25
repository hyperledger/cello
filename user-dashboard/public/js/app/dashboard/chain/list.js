
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/5.
 */
define([
    "jquery",
    "cookie",
    "app/dashboard/profile",
    "app/dashboard/chain/apply",
    "app/dashboard/chain/edit",
    "app/dashboard/chain/release",
    "app/dashboard/chain/operate",
    "app/kit/overlayer",
    "app/kit/ui",
    "plugin/text!resources/dashboard/chain/chain.html",
    "uikit",
    "lodash"
], function($, Cookies, Profile, ApplyChain, EditChain, ReleaseChain, OperateChain, Overlayer, UI, chain) {
    $(function() {
        new Profile();

        var ui = new UI();
        var $chainContainer = $("tbody");
        var $chainListPagination = $("#chainListPagination");
        var $applyBtn = $(".add-section a");

        function chainlist() {
            var applyChain = new ApplyChain(this);
            var editChain = new EditChain(this);
            var releaseChain = new ReleaseChain(this);
            var operateChain = new OperateChain(this);

            function handler() {
                $(this).parents(".uk-dropdown").hide();
                var actionType = $(this).data("type");
                if (actionType == "edit") {
                    var id = $(this).data("chainId");
                    var name = $(this).data("chainName");
                    var description = $(this).data("description");
                    editChain.show(id, name, description);
                } else if (actionType == "start" || actionType == "stop" || actionType == "restart") {
                    operateChain.show(actionType, $(this).data("chainId"));
                } else if (actionType == "release") {
                    releaseChain.show($(this).data("chainId"));
                }
            }
            $chainContainer.on("click", "li>a", handler);
            $chainListPagination.on("select.uk.pagination", function(event, pageIndex) {
                this.search(pageIndex + 1);
            }.bind(this));
            $applyBtn.on("click", function() {
                applyChain.show();
            });
        }
        chainlist.prototype = {
            search: function(pageNo) {
                var userInfo = Cookies.getJSON("BlockChainAccount");
                var overlayer = new Overlayer();
                overlayer.show();
                $.ajax({
                    type: "GET",
                    url: "/api/" + userInfo.apikey + "/chain/list",
                    data: {
                        page: pageNo
                    },
                    dataType: "json",
                    success: function(data) {
                        overlayer.hide();
                        if (data.success) {
                            $chainContainer.empty();
                            if (data.chains.length == 0) {
                                $chainContainer.append("<tr><td colspan='8' class='no-result'>No result.</td></tr>");
                                $chainListPagination.hide();
                            } else {
                                var chainInfo = _.template(chain);
                                for (var i in data.chains) {
                                    var _chain = data.chains[i];
                                    $chainContainer.append(chainInfo({
                                        id: _chain.id,
                                        name: _chain.name,
                                        description: _chain.description,
                                        runTime: _chain.run_time,
                                        plugin: _chain.plugin,
                                        mode: _chain.mode == "" ? "-" : _chain.mode,
                                        size: _chain.size,
                                        instances: _chain.chaincodes > 1 ?
                                                   _chain.chaincodes + " instances" :
                                                   _chain.chaincodes + " instance",
                                        cost: _chain.cost,
                                        status: _chain.status
                                    }));
                                }
                                $chainListPagination.show();
                                if (pageNo > data.totalPage) pageNo = data.totalPage;
                                var $pagination = UIkit.pagination("#chainListPagination");
                                $pagination.currentPage = pageNo - 1;
                                $pagination.render(data.totalPage);
                            }
                        } else {
                            ui.dialog.error(data.message);
                        }
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        overlayer.hide();
                        ui.dialog.error(errorThrown);
                    }
                });
            },
            getCurrentPage: function() {
                var $pagination = UIkit.pagination("#chainListPagination");
                return $pagination.currentPage + 1;
            }
        };
        new chainlist();
    });
});