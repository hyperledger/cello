
# Copyright IBM Corp, All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#
import re


class StringValidator(object):
    # email borrowed from chenglee's validator
    REGEX_EMAIL = re.compile(
        '^[-!#$%&\'*+\\.\/0-9=?A-Z^_`{|}~]+@([-0-9A-Z]+\.)+([0-9A-Z]){2,4}$',
        re.IGNORECASE)
    REGEX_ALPHA = re.compile('^[a-z]+$', re.IGNORECASE)
    REGEX_TLD = re.compile('([a-z\-0-9]+\.)?([a-z\-0-9]+)\.([a-z]+)$',
                           re.IGNORECASE)
    REGEX_HANDLE = re.compile('[a-z0-9\_]+$', re.IGNORECASE)

    def validate(self, input, checks=[], log=False):

        results = {}
        fail = False

        # pass the input to the given checks one by one
        for check in checks:
            try:
                if isinstance(check, tuple):
                    check_name = check[0]
                    args = check[slice(1, len(check))]
                else:
                    check_name = check
                    args = None

                method = getattr(self, '_check_' + check_name)
                results[check] = method(input.strip(),
                                        args) if args else method(input)

                if not results[check]:
                    if log:
                        fail = True
                    else:
                        return False

            except Exception as e:
                raise

        return True if not fail else results

    def _check_not_empty(self, input):
        """Check if a given string is empty"""
        return False if not input else True

    def _check_is_numeric(self, input):
        """Check if a given string is numeric"""
        try:
            float(input)
            return True
        except Exception as e:
            return False

    def _check_is_alpha(self, input):
        """Check if a given string is alpha only"""
        return True if self.REGEX_ALPHA.match(input) else False

    def _check_is_alphanumeric(self, input):
        """Check if a given string is alphanumeric"""
        return True if input.isalnum() else False

    def _check_is_integer(self, input):
        """Check if a given string is integer"""
        try:
            int(input)
            return True
        except Exception as e:
            return False

    def _check_is_float(self, input):
        """Check if a given string is float"""
        try:
            return True if str(float(input)) == input else False
        except Exception as e:
            return False

    def _check_longer_than(self, input, args):
        """Check if a given string is longer than n"""
        return True if len(input) > args[0] else False

    def _check_shorter_than(self, input, args):
        """Check if a given string is shorter than n"""
        return True if len(input) < args[0] else False

    def _check_is_email(self, input):
        """Check if a given string is a valid email"""
        return True if self.REGEX_EMAIL.match(input) else False

    def _check_is_tld(self, input):
        """Check if a given string is a top level domain
        (only matches formats aaa.bbb and ccc.aaa.bbb)"""
        return True if self.REGEX_TLD.match(input) else False

    def _check_is_handle(self, input):
        """Check if a given string is a username
        handle (alpha-numeric-underscore)"""
        return True if self.REGEX_HANDLE.match(input) else False
