# Generated by Django 3.1.2 on 2020-10-11 10:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('game', '0008_gameroom_is_game_running'),
    ]

    operations = [
        migrations.AlterField(
            model_name='card',
            name='category',
            field=models.CharField(choices=[('R', 'Red'), ('B', 'Blue'), ('G', 'Green'), ('Y', 'Yellow'), ('W', 'Wild'), ('WF', 'Wild Four')], max_length=2, verbose_name='Category'),
        ),
        migrations.AlterField(
            model_name='card',
            name='number',
            field=models.PositiveSmallIntegerField(choices=[(13, 'None'), (0, 'Zero'), (1, 'One'), (2, 'Two'), (3, 'Three'), (4, 'Four'), (5, 'Five'), (6, 'Six'), (7, 'Seven'), (8, 'Eight'), (9, 'Nine'), (10, 'Skip'), (11, 'Draw Two'), (12, 'Reverse')], verbose_name='Number'),
        ),
        migrations.AlterField(
            model_name='gameroom',
            name='unique_game_id',
            field=models.CharField(default=None, max_length=10, unique=True, verbose_name='Unique ID'),
        ),
    ]