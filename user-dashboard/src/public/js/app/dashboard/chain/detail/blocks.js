
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/10.
 */
define([
    "jquery",
    "app/kit/ui",
    "app/dashboard/chain/detail/scrollspy",
    "three",
    "tween.min",
    "plugin/text!resources/dashboard/chain/detail/block.html",
    "plugin/text!resources/dashboard/chain/detail/blockdialog.html",
    "plugin/text!resources/dashboard/chain/detail/blocktitle.html",
    "plugin/text!resources/dashboard/chain/detail/transaction.html",
    "plugin/text!resources/dashboard/chain/detail/overlay.html",
    "plugin/text!resources/dashboard/chain/detail/largeContainer.html",
    "CSS3DRenderer",
    "TrackballControls"
], function($, UI, Scrollspy, THREE, TWEEN, block, blockdialog, blocktitle, transaction, overlay, largeContainer) {
    var ui = new UI();
    var scrollspy = new Scrollspy();
    var $largeContainer;
    var $expandCompressBtn;
    var $blockdialog;
    var $blockDetailDialog;
    var $blockDetailPanel;
    var $blockDetailTitle;
    var $blockchain;
    var width;
    var height;

    var renderer;
    var scene;
    var camera;
    var controls;

    var blocks = [];
    var targets = [];

    var interval = 5000;
    var timer;

    function render() {
        renderer.render(scene, camera);
    }
    function calculateHelixCoord() {
        targets = [];
        var vector = new THREE.Vector3();
        for (var i=0; i<blocks.length; i++) {
            var phi = i * Math.PI / 180 * 13;

            var object = new THREE.Object3D();
            object.position.x = 500 * Math.sin(phi);
            object.position.y = i * 5;
            object.position.z = 500 * Math.cos(phi);

            vector.x = object.position.x * 2;
            vector.y = object.position.y;
            vector.z = object.position.z * 2;

            object.lookAt(vector);
            targets.push(object);
        }
    }
    function transform(duration) {
        TWEEN.removeAll();
        for (var i in blocks) {
            var block = blocks[i];
            var target = targets[i];
            if (target != null) {
                new TWEEN.Tween(block.position)
                    .to({
                        x: target.position.x,
                        y: target.position.y,
                        z: target.position.z
                    }, Math.random() * duration + duration)
                    .easing(TWEEN.Easing.Exponential.Out)
                    .start();
                new TWEEN.Tween(block.rotation)
                    .to({
                        x: target.rotation.x,
                        y: target.rotation.y,
                        z: target.rotation.z
                    }, Math.random() * duration + duration)
                    .easing(TWEEN.Easing.Exponential.Out)
                    .start();
            }
        }
        new TWEEN.Tween(this).to({}, duration * 2).onUpdate(render).start();
    }
    function repaint() {
        calculateHelixCoord();
        transform(800);
    }
    function animate() {
        requestAnimationFrame(animate);
        TWEEN.update();
        controls.update();
    }

    function blockchain(chainId) {
        this.chainId = chainId;

        var _self = this;
        $expandCompressBtn = $("#bc .expand-compress-icon");
        $blockchain = $("#blockchain");

        $expandCompressBtn.on("click", function() {
            $largeContainer = $(largeContainer);
            $largeContainer.find(">div").append($blockchain.detach().css("height", "450px"));
            $largeContainer.on({
                "show.uk.modal": function() {
                    controls.reset();
                    renderer.setSize($blockchain.width(), $blockchain.height());
                    repaint();
                },
                "hide.uk.modal": function() {
                    $("#bc").after($blockchain.detach().css("height", "300px"));
                    $(this).remove();
                    controls.reset();
                    renderer.setSize($blockchain.width(), $blockchain.height());
                    repaint();
                }
            });
            $("body").append($largeContainer);
            var $container = UIkit.modal($largeContainer);
            $container.options.center = true;
            $container.show();
        });
        $blockchain.on("inview.uk.scrollspy", function() {
            _self.refresh();
            scrollspy.select("blocks", true);
        });
        $blockchain.on("outview.uk.scrollspy", function() {
            _self.stopRefresh();
            scrollspy.select("blocks", false);
        });
        this.init = function() {
            blocks = [];
            $.ajax({
                type: "GET",
                url: "/api/chain/" + this.chainId + "/blocks",
                dataType: "json",
                success: function(data) {
                    if (data.success) {
                        var blockInfo = _.template(block);
                        var chainHeight = data.height;
                        for (var i=0; i<chainHeight; i++) {
                            var $div = $(blockInfo({ id: i }));
                            var blockObj = new THREE.CSS3DObject($div[0]);
                            blockObj.position.set((-1) * width, 0, 0);
                            scene.add(blockObj);
                            blocks.unshift(blockObj);
                        }
                        repaint();
                    } else {
                        ui.dialog.error(data.message, 2000);
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    ui.dialog.error(errorThrown);
                }
            });
        }
    }
    blockchain.prototype = {
        load: function() {
            var _self = this;
            $blockchain.empty();

            width = $blockchain.width();
            height = $blockchain.height();

            renderer = new THREE.CSS3DRenderer();
            renderer.setSize(width, height);
            $blockchain.append(renderer.domElement);

            camera = new THREE.PerspectiveCamera(40, width / height, 1, 10000);
            camera.position.z = 1000;

            scene = new THREE.Scene();

            controls = new THREE.TrackballControls(camera, renderer.domElement);
            controls.rotateSpeed = 0.5;
            controls.minDistance = 700;
            controls.maxDistance = 1500;
            controls.addEventListener("change", render);

            var x, y;
            $blockchain.children().on("mousedown mouseup", ".block", function(evt) {
                if (evt.type == "mousedown") {
                    x = evt.pageX;
                    y = evt.pageY;
                } else if (evt.type == "mouseup") {
                    if (evt.pageX == x && evt.pageY == y) {
                        var blockId = $(evt.currentTarget).data("id");

                        $blockdialog = $(blockdialog);
                        $blockDetailPanel = $blockdialog.find(".uk-panel");
                        $blockDetailTitle = $blockdialog.find(".uk-panel-title");
                        $blockdialog.on({
                            "show.uk.modal": function() {
                                function injectTransaction(transactions, base64) {
                                    $blockDetailPanel.children(".uk-form").remove();
                                    if (transactions.length > 0) {
                                        var trans = _.template(transaction);
                                        for (var i in transactions) {
                                            $blockDetailPanel.append($(trans({
                                                uuid: transactions[i].uuid,
                                                chaincodeId: base64 ?
                                                    transactions[i].chaincodeId :
                                                    atob(transactions[i].chaincodeId),
                                                type: transactions[i].type,
                                                payload: base64 ?
                                                    transactions[i].payload :
                                                    atob(transactions[i].payload),
                                                timestamp: transactions[i].timestamp
                                            })));
                                        }
                                    }
                                }
                                var $overlay = $(overlay);
                                $blockDetailPanel.append($overlay);
                                $.ajax({
                                    type: "GET",
                                    url: "/api/chain/" + _self.chainId + "/block/" + blockId,
                                    dataType: "json",
                                    success: function(data) {
                                        $overlay.remove();
                                        $blockDetailDialog.options.bgclose = true;
                                        if (data.success) {
                                            $blockDetailTitle.append(_.template(blocktitle)({
                                                existTransaction: data.transactions.length > 0,
                                                id: blockId,
                                                timestamp: data.commitTime
                                            }));
                                            $blockDetailTitle.find("button").click(function() {
                                                if ($(this).hasClass("uk-button-danger")) {
                                                    $(this).removeClass("uk-button-danger")
                                                        .addClass("uk-button-success").text("Conceal");
                                                    injectTransaction(data.transactions, false);
                                                } else {
                                                    $(this).removeClass("uk-button-success")
                                                        .addClass("uk-button-danger").text("Reveal");
                                                    injectTransaction(data.transactions, true);
                                                }
                                            });
                                            injectTransaction(data.transactions, true);
                                        } else {
                                            ui.dialog.error(data.message, 2000);
                                        }
                                    },
                                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                                        $overlay.remove();
                                        $blockDetailDialog.options.bgclose = true;
                                        ui.dialog.error(errorThrown);
                                    }
                                });
                            },
                            "hide.uk.modal": function() {
                                $(this).remove();
                            }
                        });
                        $("body").append($blockdialog);
                        $blockDetailDialog = UIkit.modal($blockdialog);
                        $blockDetailDialog.options.bgclose = false;
                        $blockDetailDialog.show();
                    }
                }
            });
            this.init();
            animate();
        },
        refresh: function() {
            var _self = this;
            clearTimeout(timer);
            $.ajax({
                type: "GET",
                url: "/api/chain/" + this.chainId + "/blocks",
                dataType: "json",
                success: function(data) {
                    if (data.success) {
                        var chainHeight = data.height;
                        if (parseInt(chainHeight, 10) > blocks.length) {
                            var blockInfo = _.template(block);
                            for (var i=blocks.length; i<parseInt(chainHeight, 10); i++) {
                                var $div = $(blockInfo({ id: i }));
                                var blockObj = new THREE.CSS3DObject($div[0]);
                                blockObj.position.set((-1) * width, 0, 0);
                                scene.add(blockObj);
                                blocks.unshift(blockObj);
                            }
                            repaint();
                        }
                        timer = setTimeout(function() { _self.refresh(); }, interval);
                    } else {
                        ui.dialog.error(data.message, 2000);
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    ui.dialog.error(errorThrown);
                }
            });
        },
        stopRefresh: function() {
            clearTimeout(timer);
        }
    };
    return blockchain;
});