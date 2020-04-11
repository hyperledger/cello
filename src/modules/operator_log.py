import logging
from common import log_handler, LOG_LEVEL
from modules.models import modelv2

logger = logging.getLogger(__name__)


logger.setLevel(LOG_LEVEL)
logger.addHandler(log_handler)

class OperatorLogHandler(object):

    def __init__(self):
        pass

    def _schema(self, doc, many=False):
        op_log_schema = modelv2.OperatorLogSchema(many=many)
        response = op_log_schema.dump(doc).data
        return response

    def schema(self, doc, many=False):
        return self._schema(doc, many)

    def create(self, opDate, opName, opObject, opResult, operator, opDetails=None):
        op_log = modelv2.OperatorLog(
                                     opDate = opDate,
                                     opName = opName,
                                     opObject = opObject,
                                     opResult = opResult,
                                     operator = operator,
                                     opDetails = opDetails)


        op_log.save()
        return self._schema(op_log)


    def list(self, filter_data=None):
        """ List orgs with given criteria

        :param filter_data: Image with the filter properties
        :return: iteration of serialized doc
        """
        # logger.info("filter data {}".format(filter_data))
        op_logs = modelv2.OperatorLog.objects(__raw__=filter_data)
        # op_logs = modelv2.OperatorLog.objects(filter_data)
        return self._schema(op_logs, many=True)



    def record_operating_log(self, opDate, opName, opObject, resCode, operator, opDetails=None, errorMsg=''):
        opResult = {}

        if resCode >= 200 and resCode < 400:
            opResult['resDes'] = "OK"
            opResult['resCode'] = resCode
            opResult['errorMsg'] = errorMsg

        else:
            opResult['resDes'] = "ERROR"
            opResult['resCode'] = resCode
            opResult['errorMsg'] = errorMsg

        self.create(opDate=opDate,
                              opName=opName,
                              opObject=opObject,
                              opResult=opResult,
                              operator=operator,
                              opDetails=opDetails)

