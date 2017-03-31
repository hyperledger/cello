const apiBase = '/api'
module.exports = {
  name: 'Cello Dashboard',
  prefix: 'cello',
  footerText: 'Cello Dashboard',
  logoText: 'Cello',
  urls: {
      overview: {
        stat: apiBase + '/stat',
      },
      hosts: apiBase + '/hosts',
      host: apiBase + '/host'
  }
}
