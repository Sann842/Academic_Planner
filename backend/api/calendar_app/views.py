from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .permissions import IsAdminManageReadOnly, IsOwnerOrReadOnly, IsTaskOwner
from .models import Holiday, Event, Task
from .serializers import HolidaySerializer, EventSerializer, TaskSerializer, TaskStatusSerializer, RegisterSerializer


# HOLIDAY VIEWSET
# Admin can create/update/delete holidays
# Normal users can only read holidays
class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.all().order_by("date_bs")
    serializer_class = HolidaySerializer
    permission_classes = [ IsAdminManageReadOnly]


# EVENT VIEWSET
# Users can manage their own events
# Admin can view all events
class EventViewSet(viewsets.ModelViewSet):
    # queryset = Event.objects.all().order_by("date_bs")
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        # Admin can see all events
        if user.is_staff:
            return Event.objects.all().order_by("date_bs")
        # Normal users see only their events
        return Event.objects.filter(created_by=user).order_by("date_bs")

    def perform_create(self, serializer):
        # Automatically set the logged-in user as the event creator
        serializer.save(created_by=self.request.user)



# TASK VIEWSET
# Users can manage tasks assigned to them
# Admin can view all tasks
class TaskViewSet(viewsets.ModelViewSet):
    # queryset = Task.objects.all().order_by("due_date")
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, IsTaskOwner]

    def get_queryset(self):
        user = self.request.user
        # Admin can see all tasks
        if user.is_staff:
            return Task.objects.all().order_by("due_date")  
        # Normal users see only tasks assigned to them
        return Task.objects.filter(assigned_to=user).order_by("due_date")
    
    # Update task status only
    @action(detail=True, methods=["get", "patch"], serializer_class=TaskStatusSerializer)
    def update_status(self, request, pk=None):
        task = self.get_object()

        if request.method == "GET":
            # Show current status
            serializer = TaskStatusSerializer(task)
            return Response(serializer.data)

        # PATCH: update status
        serializer = TaskStatusSerializer(
            task, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(TaskSerializer(task).data)


# USER REGISTER
@api_view(["POST"])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(
            {"message": "User registered successfully"},
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)