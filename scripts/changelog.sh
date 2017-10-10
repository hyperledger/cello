#!/bin/sh
#
# Copyright 2009-2017 SAP SE or an SAP affiliate company.
# All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

# TODO (david_dornseifer): To make the script ready for release versions, git log $1..$2 has to be replaced
# by git log $1..HEAD (bug)
echo "## $2\n$(date)" >> CHANGELOG.new
echo "" >> CHANGELOG.new
git log $1..$2  --oneline | grep -v Merge | sed -e "s/\[\(FAB-[0-9]*\)\]/\[\1\](https:\/\/jira.hyperledger.org\/browse\/\1\)/" -e "s/ \(FAB-[0-9]*\)/ \[\1\](https:\/\/jira.hyperledger.org\/browse\/\1\)/" -e "s/\([0-9|a-z]*\)/* \[\1\](https:\/\/github.com\/hyperledger\/fabric\/commit\/\1)/" >> CHANGELOG.new
echo "" >> CHANGELOG.new
cat CHANGELOG.md >> CHANGELOG.new
mv -f CHANGELOG.new CHANGELOG.md
