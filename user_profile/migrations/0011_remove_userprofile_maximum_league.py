# Generated by Django 3.1.2 on 2020-10-31 07:18

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('user_profile', '0010_auto_20201031_0126'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='userprofile',
            name='maximum_league',
        ),
    ]
