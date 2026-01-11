# from rest_framework.permissions import BasePermission, SAFE_METHODS

# class IsAdminOrReadOnly(BasePermission):
#     """
#     Allow read-only access to everyone,
#     but write access only to admin users.
#     """

#     def has_permission(self, request, view):
#         # SAFE_METHODS = GET, HEAD, OPTIONS
#         if request.method in SAFE_METHODS:
#             return True
#         return request.user and request.user.is_staff

# made the holidays admin only, and the event/task owner-based
from rest_framework.permissions import BasePermission, SAFE_METHODS

# Holidays: admin can manage, users can read-only
class IsAdminManageReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_staff

# Events: owner can edit, admin can view all
class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return obj.created_by == request.user

# Tasks: only assigned user can edit
class IsTaskOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.assigned_to == request.user
