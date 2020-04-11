/*
 SPDX-License-Identifier: Apache-2.0
*/
'use strict';

const Service = require('egg').Service;

class LogService extends Service {
    async fetch() {
        const { ctx } = this;
        const startTime = ctx.req.query.start;
        const endTime = ctx.req.query.end;
        const opName = ctx.req.query.opName;
        const opObject = ctx.req.query.opObject;
        const operator = ctx.req.query.operator;
        const result = {};
        
        if (startTime === undefined && endTime !== undefined) {
            const errorMsg = 'Please input startTime to search.';
            console.log(errorMsg);
            throw new Error(errorMsg);
        } else if (startTime !== undefined && endTime === undefined) {
            const errorMsg = 'Please input endTime to search.';
            console.log(errorMsg);
            throw new Error(errorMsg);
        }
        
        const condition = {};
        if (opName !== undefined) {
            condition.opName = opName;
        }
        if (opObject !== undefined) {
            condition.opObject = opObject;
        }
        if (operator !== undefined) {
            condition.operator = operator;
        }
        
        let logs;
        let start;
        let end;
        try {
            if (startTime !== undefined && endTime !== undefined) {
                start = new Date(startTime*1);
                end = new Date(endTime*1);
                condition.opDate = { $gte: start, $lt: end };
            }
            logs = await ctx.model.Log.find(condition);
        } catch (e) {
            throw new Error(e);
        }
        result.operator_logs = logs;
        result.success = true;
        return result;
    }
    
    async deposit(opName, opObject,  opSource, operator, opDate, resCode, opDetails, opResult = {}, errorMsg = '', resDes = 'ERROR') {
        const { ctx } = this;
        if ((resCode - 400) >= 0) {
            opResult.resDes = resDes;
            opResult.resCode = resCode;
            opResult.errorMsg = errorMsg;
        }
        
        if (((resCode - 200) >= 0) && ((resCode - 200) <= 99)) {
            opResult.resDes = 'OK';
            opResult.resCode = resCode;
        }
        
        try {
            await ctx.model.Log.create({
                opDate: opDate,
                opName: opName,
                opObject: opObject,
                opSource: opSource,
                operator: operator,
                opDetails: opDetails,
                opResult: opResult,
            });
            return true;
        } catch (e) {
            console.log('deposit logs to mongo failed.err: ' + e);
            throw new Error(e);
        }
    }
}

module.exports = LogService;
