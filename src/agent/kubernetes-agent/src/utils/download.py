#
# SPDX-License-Identifier: Apache-2.0
#
import requests
import mimetypes
import os
from uuid import uuid4


def download_file(url, target_dir):
    r = requests.get(url, allow_redirects=True)
    content_type = r.headers["content-type"]
    extension = mimetypes.guess_extension(content_type)
    file_name = "%s%s" % (uuid4().hex, extension)
    target_file = os.path.join(target_dir, file_name)

    if not os.path.exists(target_dir):
        os.makedirs(target_dir)

    open(target_file, "wb").write(r.content)

    return target_file
