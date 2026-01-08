from django.db import models
from django.contrib.auth.models import User
from .utils.dates import bs_to_ad, ad_to_bs_str


class Holiday(models.Model):
    name = models.CharField(max_length=200)
    date_bs = models.DateField()  # user input
    date_ad = models.DateField(editable=False)  # auto-synced

    is_public = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        # Convert BS -> AD before saving
        self.date_ad = bs_to_ad(str(self.date_bs))
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.date_bs})"


class Event(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)

    date_bs = models.DateField()
    date_ad = models.DateField(editable=False)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name="events")

    def save(self, *args, **kwargs):
        # Convert BS -> AD before saving
        self.date_ad = bs_to_ad(str(self.date_bs))
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class Task(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    event = models.ForeignKey(Event, on_delete=models.SET_NULL, null=True, blank=True)  # use string with app label
    start_date = models.DateField()
    due_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")

    def __str__(self):
        return self.title
