from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status

from api.calendar_app.models import Event


class EventOwnershipTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username="usera", password="testpass123")
        self.user_b = User.objects.create_user(username="userb", password="testpass123")
        self.staff_user = User.objects.create_user(
            username="staffevt", password="testpass123", is_staff=True
        )
        self.event_a = Event.objects.create(
            title="User A's Event", date_bs="2082-01-01", created_by=self.user_a
        )

    def test_created_by_is_auto_assigned_not_client_supplied(self):
        self.client.force_authenticate(self.user_a)
        resp = self.client.post(
            "/api/events/",
            {
                "title": "Spoof attempt",
                "date_bs": "2082-01-05",
                # Attempting to create an event "as" user_b
                "created_by": self.user_b.id,
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["created_by"], self.user_a.id)

    def test_user_cannot_see_other_users_events(self):
        self.client.force_authenticate(self.user_b)
        resp = self.client.get("/api/events/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        event_ids = [e["id"] for e in resp.data]
        self.assertNotIn(self.event_a.id, event_ids)

    def test_staff_can_see_all_events(self):
        self.client.force_authenticate(self.staff_user)
        resp = self.client.get("/api/events/")
        event_ids = [e["id"] for e in resp.data]
        self.assertIn(self.event_a.id, event_ids)

    def test_staff_can_view_non_owned_event_detail(self):
        self.client.force_authenticate(self.staff_user)
        resp = self.client.get(f"/api/events/{self.event_a.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_non_staff_non_owner_cannot_read_event_object_permission(self):
        """
        Regression test: IsOwnerOrReadOnly's SAFE_METHODS bypass is now
        staff-only, not "any authenticated user". get_queryset() already
        filters this case out (see test_user_cannot_see_other_users_events
        and the 404 test above), so this is defense-in-depth - directly
        exercises has_object_permission() with a non-owner, non-staff user
        and an object that IS in scope, to make sure the permission class
        itself denies read access rather than only relying on the queryset.
        """
        from api.calendar_app.permissions import IsOwnerOrReadOnly
        from django.test import RequestFactory

        permission = IsOwnerOrReadOnly()
        request = RequestFactory().get("/api/events/1/")
        request.user = self.user_b
        self.assertFalse(
            permission.has_object_permission(request, None, self.event_a)
        )

    def test_user_cannot_edit_other_users_event(self):
        """
        404, not 403: get_queryset() already filters to only the user's
        own events, so user_b's queryset doesn't contain event_a at all.
        DRF's get_object() looks it up within that filtered queryset and
        finds nothing, so it 404s before has_object_permission() is even
        reached. This is arguably better privacy than a 403 would be - it
        doesn't confirm the event exists at all to a non-owner.
        """
        self.client.force_authenticate(self.user_b)
        resp = self.client.patch(
            f"/api/events/{self.event_a.id}/", {"title": "Hijacked"}
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_can_edit_own_event(self):
        self.client.force_authenticate(self.user_a)
        resp = self.client.patch(
            f"/api/events/{self.event_a.id}/", {"title": "Updated title"}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["title"], "Updated title")

    def test_anonymous_user_cannot_access_events(self):
        resp = self.client.get("/api/events/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)