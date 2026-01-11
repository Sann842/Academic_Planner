from rest_framework.permissions import BasePermission, SAFE_METHODS

# HOLIDAY PERMISSIONS
# Admin users can create/update/delete holidays
# All users can only read (GET, HEAD, OPTIONS)
class IsAdminManageReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_staff

# EVENT PERMISSIONS
# Event owner can edit/delete their own events
# Admin can read events
class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.created_by == request.user

# TASK PERMISSIONS
# Only the assigned user can view or edit the task
class IsTaskOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.assigned_to == request.user
