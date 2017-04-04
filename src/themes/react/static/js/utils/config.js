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
      host: {
        list: apiBase + '/hosts',
        create: apiBase + '/host',
        delete: apiBase + '/host',
        update: apiBase + '/host',
        operation: apiBase + '/host_op'
      }
  }
}
