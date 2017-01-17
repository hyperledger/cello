module.exports = [
  {
    key: 'overview',
    name: 'Overview',
    icon: 'laptop'
  },
  {
    key: 'hosts',
    name: 'Hosts',
    icon: 'user'
  },
  {
    key: 'chains',
    name: 'Chains',
    icon: 'camera-o',
    clickable: false,
    child: [
      {
        key: 'active',
        name: 'Active Chains'
      },
      {
        key: 'inused',
        name: 'Inused Chains'
      }
    ]
  },
  {
    key: 'release',
    name: 'Release History',
    icon: 'user'
  },
  {
    key: 'about',
    name: 'About',
    icon: 'user'
  }
]
