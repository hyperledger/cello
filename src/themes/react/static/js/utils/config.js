const apiBase = '/api'
module.exports = {
  name: 'Cello Dashboard',
  prefix: 'cello',
  footerText: 'Cello Dashboard',
  logoText: 'Cello',
  urls: {
    queryStat: apiBase + '/stat',
    hosts: apiBase + '/hosts'
  }
}
