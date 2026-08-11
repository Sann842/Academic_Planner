from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status

from api.calendar_app.models import Task


class TaskAssignmentTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username="taska", password="testpass123")
        self.user_b = User.objects.create_user(username="taskb", password="testpass123")

    def test_assigned_to_is_auto_assigned_not_client_supplied(self):
        self.client.force_authenticate(self.user_a)
        resp = self.client.post(
            "/api/tasks/",
            {
                "title": "Spoof attempt",
                "start_date_bs": "2083-04-10",
                "due_date_bs": "2083-04-15",
                "status": "pending",
                # Attempting to assign this task to user_b instead
                "assigned_to": self.user_b.id,
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["assigned_to"], self.user_a.id)

    def test_create_without_assigned_to_field_succeeds(self):
        """
        Regression test: the create form never sends assigned_to at all,
        which used to 400 before assigned_to was made read-only + auto-set.
        """
        self.client.force_authenticate(self.user_a)
        resp = self.client.post(
            "/api/tasks/",
            {
                "title": "No assigned_to in payload",
                "start_date_bs": "2083-04-10",
                "due_date_bs": "2083-04-15",
                "status": "pending",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resp.data["assigned_to"], self.user_a.id)


class TaskOwnershipTests(APITestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(username="ownera", password="testpass123")
        self.user_b = User.objects.create_user(username="ownerb", password="testpass123")
        self.staff_user = User.objects.create_user(
            username="staffowner", password="testpass123", is_staff=True
        )
        self.task_a = Task.objects.create(
            title="User A's Task",
            assigned_to=self.user_a,
            start_date_bs="2083-04-10",
            due_date_bs="2083-04-15",
            status="pending",
        )

    def test_user_cannot_see_other_users_tasks(self):
        self.client.force_authenticate(self.user_b)
        resp = self.client.get("/api/tasks/")
        task_ids = [t["id"] for t in resp.data]
        self.assertNotIn(self.task_a.id, task_ids)

    def test_staff_can_see_all_tasks(self):
        self.client.force_authenticate(self.staff_user)
        resp = self.client.get("/api/tasks/")
        task_ids = [t["id"] for t in resp.data]
        self.assertIn(self.task_a.id, task_ids)

    def test_staff_can_view_non_owned_task_detail(self):
        """
        Regression test: staff could see a task in the list view but got
        a 403 clicking into its detail, because IsTaskOwner had no
        exception for staff/safe-methods (unlike Event's equivalent).
        """
        self.client.force_authenticate(self.staff_user)
        resp = self.client.get(f"/api/tasks/{self.task_a.id}/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_staff_cannot_edit_non_owned_task(self):
        # Staff gets read access but not write access to others' tasks.
        self.client.force_authenticate(self.staff_user)
        resp = self.client.patch(
            f"/api/tasks/{self.task_a.id}/", {"status": "completed"}
        )
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)

    def test_user_cannot_edit_other_users_task(self):
        """
        404, not 403 - see the matching comment in test_api_events.py's
        test_user_cannot_edit_other_users_event for why.
        """
        self.client.force_authenticate(self.user_b)
        resp = self.client.patch(
            f"/api/tasks/{self.task_a.id}/", {"status": "completed"}
        )
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_can_edit_own_task(self):
        self.client.force_authenticate(self.user_a)
        resp = self.client.patch(
            f"/api/tasks/{self.task_a.id}/", {"status": "completed"}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "completed")


class TaskStatusValidationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="statususer", password="testpass123")
        self.client.force_authenticate(self.user)

    def _create_task(self, status_value="pending"):
        return self.client.post(
            "/api/tasks/",
            {
                "title": "Status test task",
                "start_date_bs": "2083-04-10",
                "due_date_bs": "2083-04-15",
                "status": status_value,
            },
        )

    def test_lowercase_snake_case_status_accepted(self):
        for value in ("pending", "in_progress", "completed"):
            resp = self._create_task(value)
            self.assertEqual(
                resp.status_code, status.HTTP_201_CREATED, msg=f"status={value}"
            )

    def test_capitalized_status_rejected(self):
        """
        Regression test for the frontend/backend casing mismatch bug:
        the backend only ever accepted lowercase snake_case values.
        """
        resp = self._create_task("Pending")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_status_action_get(self):
        create_resp = self._create_task("pending")
        task_id = create_resp.data["id"]
        resp = self.client.get(f"/api/tasks/{task_id}/update_status/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "pending")

    def test_update_status_action_patch(self):
        create_resp = self._create_task("pending")
        task_id = create_resp.data["id"]
        resp = self.client.patch(
            f"/api/tasks/{task_id}/update_status/", {"status": "in_progress"}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "in_progress")

    def test_update_status_action_cannot_change_title(self):
        """
        Regression test: TaskStatusSerializer previously also exposed
        "title" as writable, meaning a "status update" endpoint could
        silently rename the task too. Now restricted to just "status".
        """
        create_resp = self._create_task("pending")
        task_id = create_resp.data["id"]
        original_title = create_resp.data["title"]
        resp = self.client.patch(
            f"/api/tasks/{task_id}/update_status/",
            {"status": "in_progress", "title": "Hijacked title"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["title"], original_title)


class TaskDateValidationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="dateuser", password="testpass123")
        self.client.force_authenticate(self.user)

    def test_due_before_start_rejected_on_create(self):
        resp = self.client.post(
            "/api/tasks/",
            {
                "title": "Bad dates",
                "start_date_bs": "2083-04-15",
                "due_date_bs": "2083-04-10",
                "status": "pending",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("due_date_bs", resp.data)

    def test_due_equal_to_start_accepted(self):
        resp = self.client.post(
            "/api/tasks/",
            {
                "title": "Same day task",
                "start_date_bs": "2083-04-10",
                "due_date_bs": "2083-04-10",
                "status": "pending",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_due_before_start_rejected_on_full_update(self):
        create_resp = self.client.post(
            "/api/tasks/",
            {
                "title": "Editable task",
                "start_date_bs": "2083-04-10",
                "due_date_bs": "2083-04-15",
                "status": "pending",
            },
        )
        task_id = create_resp.data["id"]
        resp = self.client.patch(
            f"/api/tasks/{task_id}/",
            {"start_date_bs": "2083-04-13", "due_date_bs": "2083-04-09"},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    def test_status_only_patch_not_blocked_by_existing_valid_dates(self):
        """
        Regression test: a status-only PATCH must not be blocked by the
        due/start check falling back to the instance's own (valid) dates.
        """
        create_resp = self.client.post(
            "/api/tasks/",
            {
                "title": "Status only patch task",
                "start_date_bs": "2083-04-10",
                "due_date_bs": "2083-04-15",
                "status": "pending",
            },
        )
        task_id = create_resp.data["id"]
        resp = self.client.patch(f"/api/tasks/{task_id}/", {"status": "completed"})
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["status"], "completed")

    def test_invalid_bs_date_rejected(self):
        resp = self.client.post(
            "/api/tasks/",
            {
                "title": "Bad BS date",
                "start_date_bs": "2083-04-10",
                # 2083 month 4 only has 32 days at most; 33 is invalid regardless
                "due_date_bs": "2083-04-33",
                "status": "pending",
            },
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)