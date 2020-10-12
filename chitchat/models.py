from django.db import models
from django.contrib.auth.models import User


class ThreadManager(models.Manager):

    def get_thread_for_dual(self, person1, person2):
        person1_instance = User.objects.get(username=person1).id
        person2_instance = User.objects.get(username=person2).id
        # print(person1_instance, person2_instance)
        try:
            queryset1 = Thread.objects.get(person1=person1_instance, person2=person2_instance)
        except Thread.DoesNotExist:
            queryset1 = None
        if queryset1 is not None:
            print("query Set 1 is :",queryset1)
            return queryset1
        else:
            try:
                queryset2 = Thread.objects.get(person1=person2_instance, person2=person1_instance)
            except Thread.DoesNotExist:
                queryset2 = None
            if queryset2:
                print("query Set 2 is :", queryset2)
                return queryset2
            else:
                print("None Returned")
                return None

    def create_thread(self, person1, person2):
        person1_instance = User.objects.get(username=person1)
        person2_instance = User.objects.get(username=person2)
        thread_instance = self.model(
            person1=person1_instance,
            person2=person2_instance
        )
        thread_instance.save()
        return thread_instance


class Thread(models.Model):
    person1 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='person1')
    person2 = models.ForeignKey(User, on_delete=models.CASCADE, related_name='person2')
    updated = models.DateTimeField(auto_now=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    objects = ThreadManager()


class ChatMessage(models.Model):
    thread = models.ForeignKey(Thread, null=True, blank=True, on_delete=models.SET_NULL)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
