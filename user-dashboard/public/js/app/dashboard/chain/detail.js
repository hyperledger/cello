/**
 * Created by lixuc on 2017/5/10.
 */
define([
    "jquery",
    "app/dashboard/profile",
    "app/dashboard/chain/detail/topology",
    "app/dashboard/chain/detail/log",
    "app/dashboard/chain/detail/blocks",
    "app/dashboard/chain/detail/api",
    "app/dashboard/chaincode/list",
    "uikit"
], function($, Profile, Topology, Log, Blocks, API, Chaincodelist) {
    $(function() {
        new Profile();

        var $chainId = $("#chainId");
        var topology = new Topology($chainId.val());
        var log = new Log($chainId.val());
        var blocks = new Blocks($chainId.val());
        new API();
        new Chaincodelist($chainId.val());

        topology.load();
        log.load();
        blocks.load();
    });
});