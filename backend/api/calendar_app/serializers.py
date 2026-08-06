from rest_framework import serializers
from .models import Holiday, Event, Task
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


# AUTH: JWT TOKEN SERIALIZER
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Adds is_staff (and username, for convenience) as claims embedded
    directly in the JWT, so the frontend can know a user's real admin
    status without a client-side username=="admin" guess and without an
    extra API round-trip. Since SimpleJWT copies custom claims from the
    refresh token into every newly-minted access token on /api/auth/refresh/
    too, this stays accurate across silent token refreshes automatically.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["is_staff"] = user.is_staff
        token["username"] = user.username
        return token


# HOLIDAY SERIALIZER
class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = "__all__"

        # Prevent users from modifying auto-generated AD date
        read_only_fields = ("date_ad",)

    # Note: no explicit validate_date_bs() here - DRF's ModelSerializer
    # automatically copies the model field's validators=[validate_bs_date]
    # onto the generated CharField, so invalid dates are already rejected
    # with a clean error before any custom validate_<field>() hook would
    # even run (confirmed: such a hook here never actually executes).


# EVENT SERIALIZER
class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = "__all__"

        # Fields are set automatically and should not be edited by users
        read_only_fields = ("date_ad", "created_by")

    # See HolidaySerializer's comment - same reasoning applies here.


# TASK SERIALIZER
class TaskSerializer(serializers.ModelSerializer):
    # Read-only field to show the username of the assigned user
    assigned_to_name = serializers.CharField(source="assigned_to.username", read_only=True)

    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = ("start_date_ad", "due_date_ad", "assigned_to")

    # See HolidaySerializer's comment - same reasoning applies to both BS
    # date fields here.

    def validate(self, data):
        # Fall back to the existing instance's value for partial updates
        # (e.g. PATCH only changing status) where one of the two dates
        # isn't present in the incoming data.
        start = data.get("start_date_bs", getattr(self.instance, "start_date_bs", None))
        due = data.get("due_date_bs", getattr(self.instance, "due_date_bs", None))

        # Safe to compare as plain strings: both are always zero-padded
        # "YYYY-MM-DD", so lexicographic order matches chronological order.
        if start and due and due < start:
            raise serializers.ValidationError(
                {"due_date_bs": "Due date cannot be before the start date."}
            )
        return data


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