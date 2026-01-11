from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .permissions import IsAdminManageReadOnly, IsOwnerOrReadOnly, IsTaskOwner
from .models import Holiday, Event, Task
from .serializers import HolidaySerializer, EventSerializer, TaskSerializer


# Holidays: admin can manage, users read-only
class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.all().order_by("date_bs")
    serializer_class = HolidaySerializer
    permission_classes = [ IsAdminManageReadOnly]

# Events: users can manage their own, admin can view all
class EventViewSet(viewsets.ModelViewSet):
    # queryset = Event.objects.all().order_by("date_bs")
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    # Filter events by users
    def get_queryset(self):
        user = self.request.user
        # admin
        if user.is_staff:
            return Event.objects.all().order_by("date_bs")
        # normal users
        return Event.objects.filter(created_by=user).order_by("date_bs")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    # Filter events by month
    # def get_queryset(self):
    #     month = self.request.query_params.get("month")
    #     qs = super().get_queryset()
    #     return qs.filter(date_ad__month=month) if month else qs


# Tasks: users can manage their own
class TaskViewSet(viewsets.ModelViewSet):
    # queryset = Task.objects.all().order_by("due_date")
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsTaskOwner]

    def get_queryset(self):
        user = self.request.user
        # admin
        if user.is_staff:
            return Task.objects.all().order_by("due_date")  
        # normal users
        return Task.objects.filter(assigned_to=user).order_by("due_date")
    
    # Update task status
    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        task = self.get_object()
        task.status = request.data.get("status", task.status)
        task.save()
        return Response(TaskSerializer(task).data)
