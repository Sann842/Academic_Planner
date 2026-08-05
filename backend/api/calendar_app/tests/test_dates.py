from django.test import TestCase
from django.core.exceptions import ValidationError
from datetime import date

from api.calendar_app.utils.dates import (
    parse_bs_date,
    validate_bs_date,
    bs_to_ad,
    ad_to_bs_str,
)


class ParseBsDateTests(TestCase):
    def test_valid_date_parses(self):
        parsed = parse_bs_date("2082-01-15")
        self.assertEqual((parsed.year, parsed.month, parsed.day), (2082, 1, 15))

    def test_valid_32_day_month_parses(self):
        # 2082 month 3 (Ashadh) genuinely has 32 days in the BS calendar
        parsed = parse_bs_date("2082-03-32")
        self.assertEqual((parsed.year, parsed.month, parsed.day), (2082, 3, 32))

    def test_day_32_in_31_day_month_rejected(self):
        # 2082 month 1 (Baisakh) only has 31 days
        with self.assertRaises(ValueError):
            parse_bs_date("2082-01-32")

    def test_month_13_rejected(self):
        with self.assertRaises(ValueError):
            parse_bs_date("2082-13-01")

    def test_malformed_string_rejected(self):
        with self.assertRaises(ValueError):
            parse_bs_date("not-a-date")

    def test_wrong_format_rejected(self):
        with self.assertRaises(ValueError):
            parse_bs_date("2082/01/15")

    def test_non_string_rejected(self):
        with self.assertRaises(ValueError):
            parse_bs_date(None)


class ValidateBsDateTests(TestCase):
    def test_valid_date_passes(self):
        # Should not raise
        validate_bs_date("2082-01-15")

    def test_invalid_date_raises_django_validation_error(self):
        with self.assertRaises(ValidationError):
            validate_bs_date("2082-01-32")


class ConversionRoundTripTests(TestCase):
    def test_bs_to_ad_known_value(self):
        # 2082-01-15 BS is a known, verified conversion to AD
        self.assertEqual(bs_to_ad("2082-01-15"), date(2025, 4, 28))

    def test_round_trip_ad_to_bs_to_ad(self):
        original = date(2026, 7, 26)
        bs_str = ad_to_bs_str(original)
        converted_back = bs_to_ad(bs_str)
        self.assertEqual(original, converted_back)