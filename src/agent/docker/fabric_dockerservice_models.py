class FabricServiceModel(object):
    def __init__(self, service_name, image, container_name,
                 environment, port_mapping, volume_mapping,
                 command, expose_ports = None,
                 depends_on = None, restart = None):
        self.service_name = service_name
        self.image = image
        self.container_name = container_name
        self.environment = environment
        if port_mapping:
            self.ports = ['{hp}:{cp}'.format(hp=hp,cp=cp) for (hp, cp) in port_mapping]
        else:
            self.ports = None
        self.volumes = ['{hv}:{cv}'.format(hv=hv, cv=cv) for (hv, cv) in volume_mapping]
        self.networks = ['celloNet'] #it is a fix suffix, the whole network name is net_id[:12]_cellNet
        self.command = command
        self.expose = expose_ports # 'expose' port won't expose port to host
        self.depends_on = depends_on
        self.restart = restart

    def to_dict(self):
        res = {self.service_name: {'image': self.image,
                                        'container_name': self.container_name,
                                        'environment': self.environment,
                                        'ports': self.ports,
                                        'volumes': self.volumes,
                                        'networks': self.networks,
                                        'command': self.command,
                                        'expose': self.expose,
                                        'depends_on': self.depends_on
                                        }
               }

        service_items = res[self.service_name]
        # if value is None,filter that key
        for key in list(service_items.keys()):
            if service_items[key] is None:
                del service_items[key]
        return res



