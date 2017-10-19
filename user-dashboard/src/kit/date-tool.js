
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/3.
 */
module.exports = {
    diff2Now: function(time) {
        var now = new Date().getTime() / 1000;
        var diff = now - time;
        if (diff < 60) {
            return "less than 1 minute";
        } else if (diff >= 60 && diff < 3600) {
            var minute = Math.round(diff / 60);
            return "about " + minute + (minute == 1 ? " minute" : " minutes");
        } else if (diff >= 3600 && diff < 3600 * 24) {
            var hour = Math.round(diff / 3600);
            return "about " + hour + (hour == 1 ? " hour" : " hours");
        } else {
            var day = Math.round(diff / (3600 * 24));
            return day + (day == 1 ? " day" : " days");
        }
    },
    format: function(time, type) {
        var date = new Date(time);
        var year = date.getFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var hour = date.getHours();
        var min = date.getMinutes();
        var sec = date.getSeconds();
        if (month < 10) month = "0" + month;
        if (day < 10) day = "0" + day;
        if (hour < 10) hour = "0" + hour;
        if (min < 10) min = "0" + min;
        if (sec < 10) sec = "0" + sec;
        if (type == 0) return hour + ":" + min + ":" + sec + " " + month + "/" + day;
        else return year + "-" + month + "-" + day + " " + hour + ":" + min + ":" + sec;
    },
    parse: function(time) {
        if (time < 60) {
            return [Math.round(time), "s"];
        } else if (time >= 60 && time < 3600) {
            var minute = Math.floor(time / 60);
            var second = Math.floor(time % 60);
            if (second == 0) return [minute, "m"];
            else return [minute, "m", second, "s"];
        } else if (time >= 3600 && time < 3600 * 24) {
            var hour = Math.floor(time / 3600);
            var remain = Math.floor(time % 3600);
            if (remain >= 60) {
                var minute = Math.round(remain / 60);
                return [hour, "h", minute, "m"];
            } else {
                return [hour, "h"];
            }
        } else {
            var day = Math.floor(time / (3600 * 24));
            var remain = Math.floor(time % (3600 * 24));
            if (remain >= 3600) {
                var hour = Math.round(remain / 3600);
                return [day, "d", hour, "h"];
            } else if (remain >= 60) {
                var minute = Math.round(remain / 60);
                return [day, "d", minute, "m"];
            } else {
                return [day, "d"];
            }
        }
    },
    parse2Str: function(time) {
        var t = this.parse(time);
        var parsedTime = "";
        for (var i=0; i<t.length; i+=2) {
            parsedTime += t[i] + t[i+1];
            if (i < t.length - 2) parsedTime += " ";
        }
        return parsedTime;
    }
};