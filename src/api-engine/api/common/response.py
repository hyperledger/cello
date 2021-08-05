
"""Class represents response format.
        {
            status, successful/fail
            data,  response
            msg, error messages
        }

    """
def ok(data):
    return {
        "data": data,
        "msg": None,
        "status": "succesful"
    }


def err(msg):
    return {
        "data": None,
        "msg": msg,
        "status": "fail"
    }
