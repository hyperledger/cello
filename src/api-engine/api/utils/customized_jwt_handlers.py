def jwt_get_user_id_from_payload_handler(payload):
    """
    Return user id from payload.

    :param payload: encoded JSON object.
    :return: user id.
    :rtype: string.

    """
    return payload.get("user_id")
