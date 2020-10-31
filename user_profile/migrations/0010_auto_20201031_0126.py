# Generated by Django 3.1.2 on 2020-10-30 19:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user_profile', '0009_auto_20201031_0025'),
    ]

    operations = [
        migrations.AlterField(
            model_name='userprofile',
            name='is_league_changed',
            field=models.PositiveSmallIntegerField(choices=[(0, 'No'), (1, 'Upgraded'), (2, 'Degraded')], default=0, verbose_name='Is League Changed'),
        ),
    ]