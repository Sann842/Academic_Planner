from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status


class RegisterTests(APITestCase):
    def test_register_works_without_authentication(self):
        """
        Regression test: DEFAULT_PERMISSION_CLASSES defaults to
        IsAuthenticated now (previously AllowAny), so register must
        explicitly opt out via its own @permission_classes([AllowAny]) -
        otherwise no one could ever create their first account.
        """
        resp = self.client.post(
            "/api/auth/register/",
            {"username": "anonreguser", "password": "StrongPass123"},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

    def test_register_creates_non_staff_user(self):
        resp = self.client.post(
            "/api/auth/register/",
            {"username": "newuser", "password": "StrongPass123"},
        )
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="newuser")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_register_rejects_weak_password(self):
        resp = self.client.post(
            "/api/auth/register/",
            {"username": "weakpassuser", "password": "123"},
        )
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(User.objects.filter(username="weakpassuser").exists())


class LoginTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="loginuser", password="testpass123")

    def test_login_with_correct_credentials_returns_tokens(self):
        resp = self.client.post(
            "/api/auth/login/",
            {"username": "loginuser", "password": "testpass123"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertIn("access", resp.data)
        self.assertIn("refresh", resp.data)

    def test_login_with_wrong_password_rejected(self):
        resp = self.client.post(
            "/api/auth/login/",
            {"username": "loginuser", "password": "wrongpassword"},
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class AuthOrderingTests(APITestCase):
    """
    Regression tests for the DEFAULT_AUTHENTICATION_CLASSES ordering fix.

    JWTAuthentication must be listed before SessionAuthentication, because
    DRF decides between a 401 (WWW-Authenticate present) and a 403 (no
    header) based on the FIRST authenticator in the list. With Session
    listed first, an invalid/expired JWT was incorrectly surfacing as 403,
    which silently broke the frontend's token-refresh interceptor (it only
    acts on 401).
    """

    def test_invalid_token_returns_401_not_403(self):
        resp = self.client.get(
            "/api/tasks/", HTTP_AUTHORIZATION="Bearer not.a.valid.token"
        )
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_missing_token_returns_401_not_403(self):
        resp = self.client.get("/api/tasks/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_valid_token_still_works(self):
        User.objects.create_user(username="tokenuser", password="testpass123")
        login_resp = self.client.post(
            "/api/auth/login/",
            {"username": "tokenuser", "password": "testpass123"},
        )
        access = login_resp.data["access"]
        resp = self.client.get(
            "/api/tasks/", HTTP_AUTHORIZATION=f"Bearer {access}"
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)


class DefaultPermissionTests(APITestCase):
    """
    Regression tests for changing DEFAULT_PERMISSION_CLASSES from AllowAny
    to IsAuthenticated. Endpoints that need to be reachable anonymously
    (login, refresh, register) must keep working; anything without an
    explicit override should now require authentication by default.
    """

    def test_login_works_anonymously(self):
        User.objects.create_user(username="anonlogin", password="testpass123")
        resp = self.client.post(
            "/api/auth/login/",
            {"username": "anonlogin", "password": "testpass123"},
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_refresh_works_anonymously(self):
        User.objects.create_user(username="anonrefresh", password="testpass123")
        login_resp = self.client.post(
            "/api/auth/login/",
            {"username": "anonrefresh", "password": "testpass123"},
        )
        resp = self.client.post(
            "/api/auth/refresh/", {"refresh": login_resp.data["refresh"]}
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_api_root_now_requires_auth(self):
        """
        This is an intentional behavior change: the bare DRF browsable
        API root previously relied on the AllowAny default and was
        reachable anonymously. It has no explicit permission_classes of
        its own, so it now inherits the fail-closed IsAuthenticated
        default like any future endpoint would.
        """
        resp = self.client.get("/api/")
        self.assertEqual(resp.status_code, status.HTTP_401_UNAUTHORIZED)


class TokenClaimsTests(APITestCase):
    """
    Regression tests for embedding is_staff in the JWT itself, replacing
    the frontend's old username == "admin" guess with the real value.
    """

    def _decode_claims(self, token):
        import base64
        import json

        payload = token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        return json.loads(base64.urlsafe_b64decode(payload))

    def test_staff_user_token_carries_is_staff_true(self):
        User.objects.create_user(
            username="staffclaim", password="testpass123", is_staff=True
        )
        resp = self.client.post(
            "/api/auth/login/",
            {"username": "staffclaim", "password": "testpass123"},
        )
        claims = self._decode_claims(resp.data["access"])
        self.assertTrue(claims["is_staff"])
        self.assertEqual(claims["username"], "staffclaim")

    def test_non_staff_user_token_carries_is_staff_false(self):
        User.objects.create_user(
            username="nonstaffclaim", password="testpass123", is_staff=False
        )
        resp = self.client.post(
            "/api/auth/login/",
            {"username": "nonstaffclaim", "password": "testpass123"},
        )
        claims = self._decode_claims(resp.data["access"])
        self.assertFalse(claims["is_staff"])

    def test_is_staff_claim_survives_token_refresh(self):
        User.objects.create_user(
            username="refreshclaim", password="testpass123", is_staff=True
        )
        login_resp = self.client.post(
            "/api/auth/login/",
            {"username": "refreshclaim", "password": "testpass123"},
        )
        refresh_resp = self.client.post(
            "/api/auth/refresh/", {"refresh": login_resp.data["refresh"]}
        )
        claims = self._decode_claims(refresh_resp.data["access"])
        self.assertTrue(claims["is_staff"])