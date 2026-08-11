from django.contrib import admin
from .models import Holiday, Event, Task


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ("name", "date_bs", "date_ad", "is_public")
    list_filter = ("is_public",)
    search_fields = ("name",)
    ordering = ("date_bs",)
    date_hierarchy = "date_ad"
    """
    date_ad is auto-computed in Holiday.save() from date_bs - shown for
    reference but not directly editable here.
    """
    readonly_fields = ("date_ad",)


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "date_bs", "date_ad", "created_by")
    list_filter = ("created_by",)
    search_fields = ("title", "description", "created_by__username")
    ordering = ("date_bs",)
    date_hierarchy = "date_ad"
    readonly_fields = ("date_ad",)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "assigned_to",
        "status",
        "start_date_bs",
        "due_date_bs",
        "due_date_ad",
        "event",
    )
    list_filter = ("status",)
    search_fields = ("title", "description", "assigned_to__username")
    ordering = ("due_date_ad",)
    date_hierarchy = "due_date_ad"
    readonly_fields = ("start_date_ad", "due_date_ad")