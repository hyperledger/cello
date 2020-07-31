class PermissionsPerMethodMixin(object):
    def get_permissions(self):
        """
        Allows overriding default permissions with @permission_classes
        """
        view = getattr(self, self.action)
        if hasattr(view, "permission_classes"):
            return [
                permission_class()
                for permission_class in view.permission_classes
            ]
        return super().get_permissions()
