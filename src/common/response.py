from flask import jsonify

CODE_OK = 200
CODE_CREATED = 201
CODE_NO_CONTENT = 204
CODE_BAD_REQUEST = 400
CODE_FORBIDDEN = 403
CODE_NOT_FOUND = 404
CODE_METHOD_NOT_ALLOWED = 405
CODE_NOT_ACCEPTABLE = 406
CODE_CONFLICT = 409

response_ok = {
    "status": "OK",
    "code": CODE_OK,
    "error": "",
    "data": {}
}

response_fail = {
    "status": "FAIL",
    "code": CODE_BAD_REQUEST,
    "error": "",
    "data": {}
}


def make_ok_response(error="", data={}, code=CODE_OK):
    response_ok['code'] = code
    response_ok["error"] = error
    response_ok["data"] = data
    return jsonify(response_ok), CODE_OK


def make_fail_response(error="Invalid request", data={},
                       code=CODE_BAD_REQUEST):
    response_fail['code'] = code
    response_fail["error"] = error
    response_fail["data"] = data
    return jsonify(response_fail), CODE_BAD_REQUEST
