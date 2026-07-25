from django.db import models
from django.contrib.auth.models import User
from .utils.dates import bs_to_ad, ad_to_bs_str, validate_bs_date


# HOLIDAY MODEL
class Holiday(models.Model):
    name = models.CharField(max_length=200)

    # Stored as "YYYY-MM-DD" text rather than DateField: Django's DateField
    # is backed by a real Gregorian date and can't hold valid BS days like
    # 31 or 32 that don't exist in the same numbered Gregorian month.
    date_bs = models.CharField(max_length=10, validators=[validate_bs_date])

    # Automatically calculated
    date_ad = models.DateField(editable=False)

    is_public = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        # Validate then convert BS date to AD before saving. Validating here
        # (not just in the serializer) keeps bad data out even via the admin
        # or shell.
        validate_bs_date(self.date_bs)
        self.date_ad = bs_to_ad(self.date_bs)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.date_bs})"


# EVENT MODEL
class Event(models.Model):
    title = models.CharField(max_length=200)

    # Optional
    description = models.TextField(blank=True)

    date_bs = models.CharField(max_length=10, validators=[validate_bs_date])

    # Automatically calculated
    date_ad = models.DateField(editable=False)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="events")

    def save(self, *args, **kwargs):
        # Validate then convert BS -> AD before saving
        validate_bs_date(self.date_bs)
        self.date_ad = bs_to_ad(self.date_bs)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


# TASK MODEL
class Task(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    title = models.CharField(max_length=200)

    # Optional
    description = models.TextField(blank=True)

    # User assigned to this task
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    
    # Optional link to an event
    event = models.ForeignKey(Event, on_delete=models.SET_NULL, null=True, blank=True)  # use string with app label
    
    start_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    def __str__(self):
        return self.title