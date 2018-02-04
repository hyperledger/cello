#!/bin/bash
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

CHECK=$(git diff --name-only HEAD * | grep -v check_license.sh | grep -v .json$ | grep -v .jpg$ | grep -v .JPG$ | grep -v .png$ | grep -v .ico$ \
  | grep -v .graffle$ | grep -v .svg$ | grep -v .pug$ | grep -v .rst$ | grep -v .git \
  | grep -v .pem$ | grep -v .crt$ | grep -v .key$ | grep -v lib/ | grep -v fonts/ | grep -v .min.css$ \
  | grep -v .block$ | grep -v .less$ | grep -v crypto-config/ | grep -v .min.js$ | grep -v .tx$ | grep -v .go$ | grep -v agent/ \
  | grep -v .md$ | grep -v ^vendor/ | grep -v ^build/ | grep -v .pb.go$ | grep -v .txt | grep -v .env | sort -u)

if [[ -z "$CHECK" ]]; then
  CHECK=$(git diff-tree --no-commit-id --name-only -r $(git log -2 \
    --pretty=format:"%h") | grep -v check_license.sh | grep -v .json$ | grep -v .jpg$ | grep -v .JPG$ | grep -v .png$ | grep -v .ico$ \
  | grep -v .graffle$ | grep -v .svg$ | grep -v .pug$ | grep -v .rst$ | grep -v .git \
  | grep -v .pem$ | grep -v .crt$ | grep -v .key$ | grep -v lib/ | grep -v fonts/ | grep -v .min.css$ \
  | grep -v .block$ | grep -v .less$ | grep -v crypto-config/ | grep -v .min.js$  | grep -v .tx$ | grep -v .go$ | grep -v agent/ \
  | grep -v .md$ | grep -v ^vendor/ | grep -v ^build/ | grep -v .pb.go$ | grep -v .txt | grep -v .env | sort -u)
fi

echo "Checking committed files for SPDX-License-Identifier headers ..."
if [ -z "$CHECK" ]; then
   echo "All files have SPDX-License-Identifier headers"
   exit 0
fi
missing=`echo $CHECK | xargs grep -L "SPDX-License-Identifier"`
if [ -z "$missing" ]; then
   echo "All files have SPDX-License-Identifier headers"
   exit 0
fi
echo "The following files are missing SPDX-License-Identifier headers:"
echo "$missing"
echo
echo "Please replace the Apache license header comment text with:"
echo "SPDX-License-Identifier: Apache-2.0"
exit 1