module.exports = {
  defaultChannelName: "mychannel",
  fileUploadLimits: "100MB",
  limit: {
    chainNumber: 2
  },
  path: {
    chain: "/opt/data/users/%s/chains/%s",
    chainCode: "/opt/data/users/%s/chain_codes/%s"
  },
  examples: {
    fabric: "/usr/app/src/src/config-template/cc_code/examples/fabric",
    ink: "/usr/app/src/src/config-template/cc_code/examples/ink"
  }
}