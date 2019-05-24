#!/bin/bash -ue
#
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
# Get list of files that have been modified
patterns=$(dirname $0)/exclude-patterns
if CHECK=$(git diff --name-only HEAD * | grep -v -f $patterns | sort -u); then
    echo "Checking files currently modified"
else
    CHECK=$(git diff-tree --no-commit-id --name-only  \
                -r $(git log -2 --pretty=format:"%h") \
                | grep -v -f $patterns | sort -u)
    echo "Checking files in last commit"
fi

set -o pipefail
echo "Checking committed files for SPDX-License-Identifier headers ..."
if [ -z "$CHECK" ]; then
   echo "All files have SPDX-License-Identifier headers"
   exit 0
fi

if missing=$(echo $CHECK | xargs grep -L "SPDX-License-Identifier"); then
   echo "All files have SPDX-License-Identifier headers"
   exit 0
fi
echo "The following files are missing SPDX-License-Identifier headers:"
echo "$missing"
echo
echo "Please replace the Apache license header comment text with:"
echo "SPDX-License-Identifier: Apache-2.0"
exit 1
