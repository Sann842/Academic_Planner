from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status

from api.calendar_app.models import Holiday


class HolidayPermissionTests(APITestCase):
    def setUp(self):
        self.staff_user = User.objects.create_user(
            username="staffuser", password="testpass123", is_staff=True
        )
        self.normal_user = User.objects.create_user(
            username="normaluser", password="testpass123"
        )
        self.holiday = Holiday.objects.create(
            name="Existing Holiday", date_bs="2082-01-01", is_public=True
        )

    def test_anonymous_user_can_read_holidays(self):
        # IsAdminManageReadOnly explicitly allows anyone to read (no
        # IsAuthenticated in the permission chain for this viewset).
        resp = self.client.get("/api/holidays/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_normal_user_cannot_create_holiday(self):
        self.client.force_authenticate(self.normal_user)
        resp = self.client.post(
            "/api/holidays/",
            {"name": "New Holiday", "date_bs": "2082-02-01", "is_public": True},
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_staff_user_can_create_holiday(self):
        self.client.force_authenticate(self.staff_user)
        resp = self.client.post(
            "/api/holidays/",
            {"name": "New Holiday", "date_bs": "2082-02-01", "is_public": True},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["date_ad"], "2025-05-15")

    def test_staff_can_create_valid_32_day_holiday(self):
        self.client.force_authenticate(self.staff_user)
        resp = self.client.post(
            "/api/holidays/",
            {"name": "32-day Holiday", "date_bs": "2082-03-32", "is_public": True},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_invalid_bs_date_rejected(self):
        self.client.force_authenticate(self.staff_user)
        resp = self.client.post(
            "/api/holidays/",
            # 2082 month 1 only has 31 days
            {"name": "Bad Holiday", "date_bs": "2082-01-32", "is_public": True},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("date_bs", resp.data)