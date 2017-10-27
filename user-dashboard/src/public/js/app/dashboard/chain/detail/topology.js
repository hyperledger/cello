
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/10.
 */
define([
    "jquery",
    "ol",
    "app/kit/ui",
    "app/kit/common",
    "app/dashboard/chain/detail/scrollspy",
    "plugin/text!resources/dashboard/chain/detail/overlay.html",
    "plugin/text!resources/dashboard/chain/detail/largeContainer.html"
], function($, ol, UI, Common, Scrollspy, overlay, largeContainer) {
    var ui = new UI();
    var common = new Common();
    var scrollspy = new Scrollspy();
    var $largeContainer;
    var $expandCompressBtn;
    var $map;
    var $showLatency;
    var map = null;
    var interval = 5000;
    var timer;

    function createLinkStyle(property, zoom, showLatency) {
        var strokeColor = "#639E13";
        var strokeWidth = 1;
        if (property.latency != "" && !isNaN(property.latency) && property.latency >= 0.1) {
            strokeColor = "#e28327";
            strokeWidth = 2;
        }
        var lineDash = null;
        if (property.type == "nvv") {
            lineDash = [10];
        }
        var strokeStyle = new ol.style.Stroke({
            color: strokeColor,
            lineDash: lineDash,
            width: strokeWidth
        });
        if (showLatency) {
            var label = property.latency;
            if (property.latency != "" && !isNaN(property.latency)) {
                label += " ms";
            }
            var font = (zoom == 18 ? "30px" : (zoom == 17 ? "18px" : "9px")) + " Calibri,sans-serif";
            var textStyle = new ol.style.Text({
                text: label,
                font: font,
                fill: new ol.style.Fill({
                    color: "#847574"
                }),
                stroke: new ol.style.Stroke({
                    color: "#fff",
                    width: 3
                })
            });
            return [new ol.style.Style({
                stroke: strokeStyle,
                text: textStyle
            })];
        } else {
            return [new ol.style.Style({
                stroke: strokeStyle
            })];
        }
    }
    function createNodeStyle(property, zoom) {
        var nodeRadius = 30;
        var nodeFont = "25px";
        if (property.type == "v") {
            nodeRadius = (zoom == 18 ? 40: (zoom == 17 ? 30 : 15));
            nodeFont = (zoom == 18 ? "35px" : (zoom == 17 ? "25px" : "12px"));
        } else {
            nodeRadius = (zoom == 18 ? 30 : (zoom == 17 ? 20 : 10));
            nodeFont = (zoom == 18 ? "25px" : (zoom == 17 ? "15px" : "8px"));
        }
        nodeFont += " Calibri,sans-serif";
        return [new ol.style.Style({
            image: new ol.style.Circle({
                radius: nodeRadius,
                fill: new ol.style.Fill({
                    color: "#F2FAE3"
                }),
                stroke: new ol.style.Stroke({
                    color: "#659F13",
                    width: 1
                })
            }),
            text: new ol.style.Text({
                text: property.id,
                font: nodeFont,
                fill: new ol.style.Fill({
                    color: "#847574"
                }),
                stroke: new ol.style.Stroke({
                    color: "#fff",
                    width: 3
                })
            })
        })];
    }
    function topology(chainId) {
        this.chainId = chainId;

        var _self = this;
        $expandCompressBtn = $("#topo .expand-compress-icon");
        $map = $("#map");
        $showLatency = $("#showLatency");
        $showLatency.prop("checked", true);

        $expandCompressBtn.on("click", function() {
            $largeContainer = $(largeContainer);
            $largeContainer.find(">div").append($map.detach().css("height", "450px"));
            $largeContainer.on({
                "show.uk.modal": function() {
                    //Set max zoom level to 18
                    _self.load(18);
                },
                "hide.uk.modal": function() {
                    $("#topo").after($map.detach().css("height", "300px"));
                    $(this).remove();
                    _self.load();
                }
            });
            $("body").append($largeContainer);
            var $container = UIkit.modal($largeContainer);
            $container.options.center = true;
            $container.show();
        });
        this.getLink = function(from, to) {
            if (map != null) {
                var layers = map.getLayers().getArray();
                var vectorSource = layers[0].getSource();
                var features = vectorSource.getFeatures();
                for (var i in features) {
                    var property = features[i].getProperties();
                    if ((property.from == from && property.to == to) ||
                        (property.from == to && property.to == from)) {
                        return features[i];
                    }
                }
            }
        }
        $map.on("inview.uk.scrollspy", function() {
            if ($showLatency.prop("checked")) {
                _self.refreshLinkLatency();
            }
            scrollspy.select("topology", true);
        });
        $map.on("outview.uk.scrollspy", function() {
            if ($showLatency.prop("checked")) {
                _self.stopRefresh();
            }
            scrollspy.select("topology", false);
        });
        $showLatency.on("change", function() {
            if (map != null) {
                var layers = map.getLayers().getArray();
                layers[0].getSource().changed();
                if ($(this).prop("checked")) {
                    _self.refreshLinkLatency();
                } else {
                    _self.stopRefresh();
                }
            }
        });
    }
    topology.prototype = {
        load: function(maxZoom) {
            if (map != null) {
                map.setTarget(null);
                map = null;
            }
            if (!maxZoom) maxZoom = 17;
            var $overlay = $(overlay);
            $map.append($overlay);
            var _self = this;
            $.ajax({
                type: "GET",
                url: "/api/chain/" + this.chainId + "/topology",
                dataType: "json",
                success: function(data) {
                    if (data.success) {
                        map = new ol.Map({
                            target: "map",
                            layers: [
                                new ol.layer.Vector({
                                    source: new ol.source.Vector({
                                        features: (new ol.format.GeoJSON()).readFeatures(data.links)
                                    }),
                                    style: function(feature, resolution) {
                                        var property = feature.getProperties();
                                        var zoom = map.getView().getZoom();
                                        return createLinkStyle(property, zoom, $showLatency.prop("checked"));
                                    }
                                }),
                                new ol.layer.Vector({
                                    source: new ol.source.Vector({
                                        features: (new ol.format.GeoJSON()).readFeatures(data.nodes)
                                    }),
                                    style: function(feature, resolution) {
                                        var property = feature.getProperties();
                                        var zoom = map.getView().getZoom();
                                        return createNodeStyle(property, zoom);
                                    }
                                })
                            ],
                            controls: [],
                            interactions: ol.interaction.defaults({
                                altShiftDragRotate: false,
                                dragPan: false,
                                keyboard: false,
                                shiftDragZoom: false,
                                pinchRotate: false,
                                pinchZoom: false
                            }).extend([new ol.interaction.DragPan()]),
                            view: new ol.View({
                                center: [0, 0],
                                zoom: 17,
                                maxZoom: maxZoom,
                                minZoom: 16
                            })
                        });
                        var drag = false;
                        var lastFea = null;
                        /**
                         * If map drag out view port, pan to view port again
                         */
                        map.on("pointerdrag", function(evt) {
                            drag = true;
                            common.pan2Viewport(map);
                        });
                        map.on("moveend", function(evt) {
                            drag = false;
                            common.pan2Viewport(map);
                        });
                        /**
                         * Show detail info when mouse move on the topology
                         */
                        map.on("pointermove", function(evt) {
                            if (!drag) {
                                var pixel = map.getEventPixel(evt.originalEvent);
                                var feature = map.forEachFeatureAtPixel(pixel,
                                    function(feature, layer) {
                                        return feature;
                                    }
                                );
                                if (feature) {
                                    if (feature != lastFea) {
                                        var geometry = feature.getGeometry();
                                        var property = feature.getProperties();
                                        if (geometry.getType() == "Point") {
                                            $map.css("cursor", "pointer");
                                            common.showNodeDetail(map, geometry, property);
                                        } else {
                                            $map.css("cursor", "");
                                            common.hideNodeDetail(map);
                                        }
                                        lastFea = feature;
                                    }
                                } else {
                                    $map.css("cursor", "");
                                    common.hideNodeDetail(map);
                                    lastFea = null;
                                }
                            }
                        });
                    } else {
                        ui.dialog.error(data.message);
                    }
                    $overlay.remove();
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    $overlay.remove();
                    ui.dialog.error(errorThrown);
                }
            });
        },
        refreshLinkLatency: function() {
            var _self = this;
            $.ajax({
                type: "GET",
                url: "/api/chain/" + this.chainId + "/topology/latency",
                dataType: "json",
                success: function(data) {
                    if (data.success) {
                        var links = data.links;
                        for (var i in links) {
                            var latency = links[i].latency;
                            if (latency != "" && !isNaN(latency)) {
                                var link = _self.getLink(links[i].from, links[i].to);
                                if (link) {
                                    link.setProperties({ latency: latency });
                                }
                            }
                        }
                    }
                    clearTimeout(timer);
                    timer = setTimeout(function() { _self.refreshLinkLatency(); }, interval);
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    ui.dialog.error(errorThrown);
                    clearTimeout(timer);
                }
            });
        },
        stopRefresh: function() {
            clearTimeout(timer);
        }
    };
    return topology;
});