# Generated by Django 3.1.2 on 2020-10-11 18:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0009_auto_20201011_1051'),
    ]

    operations = [
        migrations.AddField(
            model_name='gameroom',
            name='joined_player_count',
            field=models.IntegerField(default=0, verbose_name='Joined Player Count'),
        ),
        migrations.AddField(
            model_name='gameroom',
            name='online_player_count',
            field=models.IntegerField(default=0, verbose_name='Online Player Count'),
        ),
    ]
