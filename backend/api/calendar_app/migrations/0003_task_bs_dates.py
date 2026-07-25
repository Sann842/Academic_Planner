from django.db import migrations, models
import api.calendar_app.utils.dates


def populate_bs_dates(apps, schema_editor):
    """Backfill start_date_bs/due_date_bs from the AD dates that already
    exist (start_date_ad/due_date_ad, renamed from the old start_date/
    due_date DateFields in this same migration).

    A handful of legacy rows have a BS-style year (e.g. 2082) typed
    directly into what was an AD-only field, producing a literal but
    nonsensical far-future AD date (e.g. year 2082 CE) that nepali_datetime
    can't convert (out of its supported range). For those, we reinterpret
    the stored digits as the BS date that was clearly intended, and correct
    the AD equivalent to match.
    """
    Task = apps.get_model("calendar_app", "Task")
    dates = api.calendar_app.utils.dates
    for task in Task.objects.all():
        for prefix in ("start_date", "due_date"):
            ad_field = f"{prefix}_ad"
            bs_field = f"{prefix}_bs"
            ad_value = getattr(task, ad_field)
            try:
                bs_str = dates.ad_to_bs_str(ad_value)
            except OverflowError:
                literal_str = f"{ad_value.year:04d}-{ad_value.month:02d}-{ad_value.day:02d}"
                dates.validate_bs_date(literal_str)
                bs_str = literal_str
                setattr(task, ad_field, dates.bs_to_ad(bs_str))
            setattr(task, bs_field, bs_str)
        task.save(update_fields=["start_date_bs", "due_date_bs", "start_date_ad", "due_date_ad"])


def reverse_populate_bs_dates(apps, schema_editor):
    # Nothing to do: start_date_ad/due_date_ad already hold the AD values;
    # the BS columns are simply dropped by the reverse of AddField.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("calendar_app", "0002_alter_event_date_bs_alter_holiday_date_bs"),
    ]

    operations = [
        # Step 1: rename the existing (real AD) DateFields, no data lost
        migrations.RenameField(
            model_name="task",
            old_name="start_date",
            new_name="start_date_ad",
        ),
        migrations.RenameField(
            model_name="task",
            old_name="due_date",
            new_name="due_date_ad",
        ),
        migrations.AlterField(
            model_name="task",
            name="start_date_ad",
            field=models.DateField(editable=False),
        ),
        migrations.AlterField(
            model_name="task",
            name="due_date_ad",
            field=models.DateField(editable=False),
        ),
        # Step 2: add the new BS columns, temporarily nullable so existing
        # rows don't need a value yet
        migrations.AddField(
            model_name="task",
            name="start_date_bs",
            field=models.CharField(
                max_length=10,
                null=True,
                validators=[api.calendar_app.utils.dates.validate_bs_date],
            ),
        ),
        migrations.AddField(
            model_name="task",
            name="due_date_bs",
            field=models.CharField(
                max_length=10,
                null=True,
                validators=[api.calendar_app.utils.dates.validate_bs_date],
            ),
        ),
        # Step 3: backfill BS values converted from the preserved AD dates
        migrations.RunPython(populate_bs_dates, reverse_populate_bs_dates),
        # Step 4: now that every row has a value, make the columns required
        migrations.AlterField(
            model_name="task",
            name="start_date_bs",
            field=models.CharField(
                max_length=10,
                validators=[api.calendar_app.utils.dates.validate_bs_date],
            ),
        ),
        migrations.AlterField(
            model_name="task",
            name="due_date_bs",
            field=models.CharField(
                max_length=10,
                validators=[api.calendar_app.utils.dates.validate_bs_date],
            ),
        ),
    ]