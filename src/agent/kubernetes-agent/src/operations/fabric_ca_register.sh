#!/usr/bin/env bash
# shellcheck disable=SC2164
cd /tmp;
wget "${NODE_FILE_URL}";
# shellcheck disable=SC2034
NODE_FILE="${NODE_FILE_URL##*/}"
tar -zxf "${NODE_FILE}"
fabric-ca-client enroll -d -u https://"${CA_ADMIN_NAME}":"${CA_ADMIN_PASSWORD}"@"${CA_SERVER}"
if [ "${CA_USER_ATTRS}" -eq "" ]; then
  fabric-ca-client register -d --id.name "${CA_USER_NAME}" --id.secret "${CA_USER_PASSWORD}" --id.type "${CA_USER_TYPE}"
else
  fabric-ca-client register -d --id.name "${CA_USER_NAME}" --id.secret "${CA_USER_PASSWORD}" --id.type "${CA_USER_TYPE}" --id.attrs "${CA_USER_ATTRS}"
fi
# shellcheck disable=SC2034
# shellcheck disable=SC2181
if [ $? -eq 0 ]; then
  # shellcheck disable=SC2034
  user_status="registered"
else
  # shellcheck disable=SC2034
  user_status="fail"
fi
wget --method=PATCH --body-data "{\"status\": \"${user_status}\"}" --header "Authorization: JWT ${TOKEN}" --header "Content-Type: application/json" "${USER_PATCH_URL}"
