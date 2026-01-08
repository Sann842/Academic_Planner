from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Holiday, Event, Task
from .serializers import HolidaySerializer, EventSerializer, TaskSerializer


class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.all().order_by("date_ad")
    serializer_class = HolidaySerializer


class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all().order_by("date_ad")
    serializer_class = EventSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    # Filter events by month
    def get_queryset(self):
        month = self.request.query_params.get("month")
        qs = super().get_queryset()
        return qs.filter(date_ad__month=month) if month else qs


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().order_by("due_date")
    serializer_class = TaskSerializer

    # Update task status
    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
        task = self.get_object()
        task.status = request.data.get("status", task.status)
        task.save()
        return Response(TaskSerializer(task).data)
