from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class ThreadManager(models.Manager):

    def get_thread_for_dual(self, person1, person2):
        person1_instance = User.objects.get(username=person1).id
        person2_instance = User.objects.get(username=person2).id
        # print(person1_instance, person2_instance)
        try:
            instance_1 = Thread.objects.get(person1=person1_instance, person2=person2_instance)
        except Thread.DoesNotExist:
            instance_1 = None
        if instance_1 is not None:
            # print("query Set 1 is :",queryset1)
            return instance_1
        else:
            try:
                instance_2 = Thread.objects.get(person1=person2_instance, person2=person1_instance)
            except Thread.DoesNotExist:
                instance_2 = None
            if instance_2:
                # print("query Set 2 is :", queryset2)
                return instance_2
            else:
                # print("None Returned")
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
    updated = models.DateTimeField(default = timezone.now)
    timestamp = models.DateTimeField(default = timezone.now)

    objects = ThreadManager()


class FriendManager(models.Manager):
    def get_friend_status(self, person1, person2):
        """
        :param person1:
        :param person2:
        :return: The resulting row_instance if present in Table or None
        """
        person1_instance = User.objects.get(username=person1).id
        person2_instance = User.objects.get(username=person2).id
        try:
            instance_1 = Friend.objects.get(sender=person1_instance, receiver=person2_instance)
            return instance_1, 1
        except Friend.DoesNotExist:
            instance_1 = None

        if instance_1 is None:
            try:
                instance_2 = Friend.objects.get(sender=person2_instance, receiver=person1_instance)
                return instance_2, 2
            except Friend.DoesNotExist:
                return None, None

    def add_friend_request(self, sender, receiver):
        """
        This function will add the friends Request for person1 and person2 i.e.
        if there is now row_instance in Friend table for the 2 users => add a row with friend_status = 0
        if the friend status is 0, then will change it to 1
        if they are friends => do nothing
        if the friend status i
        :param sender:
        :param receiver:
        :return: the row_instance either old or the newly added one
        """
        row_instance, order = Friend.objects.get_friend_status(sender, receiver)
        # print("sender:", sender, "receiver:", receiver)
        if row_instance is None:  # There is not any row in Friend Table
            sender_instance = User.objects.get(username=sender)
            receiver_instance = User.objects.get(username=receiver)
            row_instance = self.create(
                sender=sender_instance,
                receiver=receiver_instance
                # friend_status = False # Although No need as it is False by default
            )
            row_instance.save()  # Basically Friend.objects.save()
        elif row_instance.friend_status is False and order is 2:  # There is a row but friend_status is 0 i.e. friend_status pending
            sender, receiver = receiver, sender # sender is now the request Sender
            row_instance.friend_status = True  # Changing it to 1 i.e. sender and receiver are now friends
            row_instance.save()
            # Adding a default message to the thread of the newly formed friends i.e. sender and receiver.
            new_thread_instance = Thread.objects.create_thread(sender, receiver)
            ChatMessage.objects.create(thread=new_thread_instance, sender=row_instance.sender, message="Hello Uno Freak!")
        else:  # There is a row but friend_status is 1 i.e. already friends
            pass
        return row_instance


class Friend(models.Model):
    """
    Row in this Table ensures one has sent Friend request to the other
    friend_status is 0 if sender has not accepted request of the receiver
    """
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sender')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='receiver')
    friend_status = models.BooleanField(default=False) # 1 => sender and receiver are friends, else pending friendship
    objects = FriendManager()


class ChatMessage(models.Model):
    thread = models.ForeignKey(Thread, null=True, blank=True, on_delete=models.SET_NULL)
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
