from rest_framework import serializers
from .models import Holiday, Event, Task
from .utils.dates import validate_bs_date
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError


# HOLIDAY SERIALIZER
class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = "__all__"

        # Prevent users from modifying auto-generated AD date
        read_only_fields = ("date_ad",)

    def validate_date_bs(self, value):
        try:
            validate_bs_date(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages[0])
        return value


# EVENT SERIALIZER
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = "__all__"

        # Fields are set automatically and should not be edited by users
        read_only_fields = ("date_ad", "created_by")

    def validate_date_bs(self, value):
        try:
            validate_bs_date(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages[0])
        return value


# TASK SERIALIZER
class TaskSerializer(serializers.ModelSerializer):
    # Read-only field to show the username of the assigned user
    assigned_to_name = serializers.CharField(source="assigned_to.username", read_only=True)

    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = ("start_date_ad", "due_date_ad")

    def validate_start_date_bs(self, value):
        try:
            validate_bs_date(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages[0])
        return value

    def validate_due_date_bs(self, value):
        try:
            validate_bs_date(value)
        except DjangoValidationError as exc:
            raise serializers.ValidationError(exc.messages[0])
        return value


# TASK STATUS SERIALIZER
class TaskStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ("title","status",)


# NEW USER LOGIN
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ("username", "password")
    
    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"]
        )
        # IMPORTANT: ensure user is NOT admin
        user.is_staff = False
        user.is_superuser = False
        user.save()
        return user