from django.db import models
from django.contrib.auth.models import User
from .utils.dates import bs_to_ad, ad_to_bs_str


# HOLIDAY MODEL
class Holiday(models.Model):
    name = models.CharField(max_length=200)
    date_bs = models.DateField()

    # Automatically calculated
    date_ad = models.DateField(editable=False)

    is_public = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        # Convert BS date to AD before saving
        self.date_ad = bs_to_ad(str(self.date_bs))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.date_bs})"


# EVENT MODEL
class Event(models.Model):
    title = models.CharField(max_length=200)

    # Optional
    description = models.TextField(blank=True)

    date_bs = models.DateField()

    # Automatically calculated
    date_ad = models.DateField(editable=False)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="events")

    def save(self, *args, **kwargs):
        # Convert BS -> AD before saving
        self.date_ad = bs_to_ad(str(self.date_bs))
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
