from datetime import date

from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

from api.calendar_app.models import Holiday, Event, Task


class HolidayModelTests(TestCase):
    def test_save_computes_date_ad_from_date_bs(self):
        holiday = Holiday.objects.create(
            name="Test Holiday", date_bs="2082-01-15", is_public=True
        )
        self.assertEqual(holiday.date_ad, date(2025, 4, 28))

    def test_save_rejects_invalid_bs_date(self):
        holiday = Holiday(name="Bad Holiday", date_bs="2082-01-32", is_public=True)
        with self.assertRaises(ValidationError):
            holiday.save()

    def test_str_representation(self):
        holiday = Holiday.objects.create(
            name="Dashain", date_bs="2082-06-15", is_public=True
        )
        self.assertEqual(str(holiday), "Dashain (2082-06-15)")


class EventModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="evtuser", password="testpass123")

    def test_save_computes_date_ad_from_date_bs(self):
        event = Event.objects.create(
            title="Test Event", date_bs="2082-03-32", created_by=self.user
        )
        # 2082 month 3 (Ashadh) genuinely has 32 days
        self.assertEqual(event.date_ad, date(2025, 7, 16))

    def test_str_representation(self):
        event = Event.objects.create(
            title="Study Group", date_bs="2082-01-15", created_by=self.user
        )
        self.assertEqual(str(event), "Study Group")


class TaskModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="taskuser", password="testpass123")

    def test_save_computes_ad_dates_from_bs(self):
        task = Task.objects.create(
            title="Test Task",
            assigned_to=self.user,
            start_date_bs="2083-04-10",
            due_date_bs="2083-04-15",
            status="pending",
        )
        self.assertEqual(task.start_date_ad, date(2026, 7, 26))
        self.assertEqual(task.due_date_ad, date(2026, 7, 31))

    def test_clean_rejects_due_before_start(self):
        task = Task(
            title="Bad Task",
            assigned_to=self.user,
            start_date_bs="2083-04-15",
            due_date_bs="2083-04-10",
            status="pending",
        )
        with self.assertRaises(ValidationError):
            task.clean()

    def test_clean_allows_due_equal_to_start(self):
        task = Task(
            title="Same Day Task",
            assigned_to=self.user,
            start_date_bs="2083-04-10",
            due_date_bs="2083-04-10",
            status="pending",
        )
        # Should not raise
        task.clean()

    def test_save_rejects_due_before_start_as_defense_in_depth(self):
        """
        Covers writes that bypass a ModelForm/clean(), e.g. direct
        .save() calls from the shell or a management command.
        """
        task = Task(
            title="Bad Task via save",
            assigned_to=self.user,
            start_date_bs="2083-04-15",
            due_date_bs="2083-04-10",
            status="pending",
        )
        with self.assertRaises(ValueError):
            task.save()

    def test_default_status_is_pending(self):
        task = Task.objects.create(
            title="Default Status Task",
            assigned_to=self.user,
            start_date_bs="2083-04-10",
            due_date_bs="2083-04-15",
        )
        self.assertEqual(task.status, "pending")

    def test_str_representation(self):
        task = Task.objects.create(
            title="Finish assignment",
            assigned_to=self.user,
            start_date_bs="2083-04-10",
            due_date_bs="2083-04-15",
        )
        self.assertEqual(str(task), "Finish assignment")