
/* Copyright IBM Corp, All Rights Reserved.

SPDX-License-Identifier: Apache-2.0
 */

/**
 * Created by lixuc on 2017/5/3.
 */
function pagination(list) {
    this.list = list;
    this.totalRow = 0;
    this.totalPage = 0;
}
pagination.prototype = {
    maxRowOnPage: 5,
    gotoPage: function(pageNo) {
        if (this.list && this.list.length && pageNo > 0) {
            this.totalRow = this.list.length;
            this.totalPage = this.totalRow % this.maxRowOnPage == 0 ?
                             this.totalRow / this.maxRowOnPage :
                             Math.floor(this.totalRow / this.maxRowOnPage) + 1;
            if (pageNo > this.totalPage) pageNo = this.totalPage;
            var fromIndex = (pageNo - 1) * this.maxRowOnPage;
            var toIndex = pageNo * this.maxRowOnPage < this.totalRow ? pageNo * this.maxRowOnPage : this.totalRow;
            return this.list.slice(fromIndex, toIndex);
        } else {
            return this.list;
        }
    },
    getTotalRow: function() {
        return this.totalRow;
    },
    getTotalPage: function() {
        return this.totalPage;
    }
};
module.exports = pagination;