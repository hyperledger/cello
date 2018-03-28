# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
FROM hyperledger/cello-baseimage:x86_64-0.8.0-beta

# use this in development
CMD ["python", "dashboard.py"]

# use this in product
#CMD ["gunicorn", "-w", "128", "-b", "0.0.0.0:8080", "dashboard:app"]

