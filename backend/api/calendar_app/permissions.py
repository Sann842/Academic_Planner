from rest_framework.permissions import BasePermission, SAFE_METHODS

# HOLIDAY PERMISSIONS
"""
Admin users can create/update/delete holidays
All users can only read (GET, HEAD, OPTIONS)
"""
class IsAdminManageReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_staff

# EVENT PERMISSIONS
"""
Event owner can edit/delete their own events
Staff can read (not edit) any event - matches EventViewSet.get_queryset(),
which gives staff visibility into every event in the list view. Only staff
get the unconditional SAFE_METHODS bypass (not just "any authenticated
user") for consistency with IsTaskOwner - currently get_queryset() already
filters non-owned events out for everyone else, so this wasn't reachable
as a live bug, but shouldn't rely on that being the only thing enforcing it.
"""
class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS and request.user.is_staff:
            return True
        return obj.created_by == request.user

# TASK PERMISSIONS
"""
Only the assigned user can view or edit the task, except staff can also
read (not edit) any task - matches TaskViewSet.get_queryset(), which
already gives staff visibility into every task in the list view. Without
this, staff could see a task existed in the list but got a 403 clicking
into its detail.
"""
class IsTaskOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS and request.user.is_staff:
            return True
        return obj.assigned_to == request.user