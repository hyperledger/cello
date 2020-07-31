import uuid
import shortuuid


def make_uuid():
    return str(uuid.uuid4())


def make_uuid_hex():
    return uuid.uuid4().hex


def make_short_uuid():
    return shortuuid.ShortUUID().random(length=16)
