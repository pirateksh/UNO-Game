import asyncio
import random
import json
from json import JSONEncoder
from django.contrib.auth import get_user_model
from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async
from channels.exceptions import StopConsumer
from .models import GameRoom, Player

User = get_user_model()


def delete_object(object_):
    del object_


class CustomEncoder(JSONEncoder):
    def default(self, o):
        return o.__dict__


class Card:
    """
    A class to represent Cards in UNO.
    """
    # Possible categories
    RED, BLUE, GREEN, YELLOW = "R", "B", "G", "Y"
    WILD, WILD_FOUR = "W", "WF"

    # Possible Numbers
    ZERO, ONE, TWO, THREE, FOUR = 0, 1, 2, 3, 4
    FIVE, SIX, SEVEN, EIGHT, NINE = 5, 6, 7, 8, 9
    SKIP, REVERSE, DRAW_TWO, NONE = 10, 11, 12, 13

    def __init__(self, category, number):
        self.category = category
        self.number = number

    def show(self):
        return f"{self.number} of {self.category}"


class Deck:

    def __init__(self):
        self.cards = []
        self.build()

    def build(self):
        """
        Method to build the Deck of Cards or Populate the Deck with Cards.
        :return:
        """
        for category in [Card.BLUE, Card.GREEN, Card.YELLOW, Card.RED]:
            self.cards.append(Card(category=category, number=Card.ZERO))

            for number in [Card.ONE, Card.TWO, Card.THREE, Card.FOUR, Card.FIVE, Card.SIX, Card.SEVEN, Card.EIGHT,
                           Card.NINE, Card.SKIP, Card.REVERSE, Card.DRAW_TWO]:
                self.cards.append(Card(category=category, number=number))
                self.cards.append(Card(category=category, number=number))

        for i in range(4):
            self.cards.append(Card(category=Card.WILD, number=Card.NONE))
            self.cards.append(Card(category=Card.WILD_FOUR, number=Card.NONE))

    def shuffle(self):
        """
        Method to Shuffle the Cards present in the Deck using Fisher Yates Shuffle algorithm.
        :return:
        """
        for i in range(int(len(self.cards)) - 1, 0, -1):
            r = random.randint(0, i)
            self.cards[i], self.cards[r] = self.cards[r], self.cards[i]

    def deal(self):
        """
        Method to draw a card
        :return:
        """
        return self.cards.pop()

    def show(self):
        for card in self.cards:
            card.show()


class PlayerServer:
    def __init__(self, username):
        self.username = username
        self.hand = []

    def draw(self, deck):
        self.hand.append(deck.deal())
        return self

    def sort_hand(self):
        self.hand.sort(key=lambda x: x.category, reverse=True)

    def show(self):
        print(f"Username: {self.username}")
        for card in self.hand:
            card.show()

    def is_card_in_hand(self, card):
        if card in self.hand:
            return True
        return False

    def __str__(self):
        return f"{self.username}"


class GameServer:
    current_games = []

    def __init__(self, unique_id, player):
        self.unique_id = unique_id
        self.players = []
        self.player_usernames = []
        self.players.append(player)
        self.player_usernames.append(player.username)
        self.deck = Deck()
        self.topcard = None
        self.is_game_running = False
        self.direction = "+"
        self.current_player_index = 0

    def __del__(self):
        print(f"Game with unique ID {self.unique_id} is deleted.")

    @classmethod
    def create_new_game(cls, unique_id, player):
        for game in cls.current_games:
            if game.unique_id == unique_id:
                print("Returning Existing Game.")
                game.players.append(player)
                game.player_usernames.append(player.username)
                return game
        print("Creating New Game.")
        new_game = GameServer(unique_id, player)
        cls.current_games.append(new_game)
        return new_game

    def deal_hands(self, cards_per_player=7):
        """
        Method to deal hands to all the connected players from the deck of this Game.
        :param cards_per_player:
        :return:
        """
        for i in range(int(cards_per_player)):
            for player in self.players:
                player.draw(self.deck)

        for player in self.players:
            player.sort_hand()

    def start_game(self):
        """
        Method to be called at the start of the game to shuffle and deal hands.
        :return:
        """
        if not self.is_game_running:
            self.deck.shuffle()
            self.deal_hands()
            self.topcard = self.deck.deal()
            self.is_game_running = True

    def end_game(self):
        """
        Method to be called at the end of the game to clear the hands of player and topcard of Game.
        :return:
        """
        if self.is_game_running:
            for player in self.players:
                if player.hand:
                    self.deck.cards.extend(player.hand)
                    player.hand.clear()

            if self.topcard:
                self.deck.cards.append(self.topcard)
                self.topcard = None

            self.is_game_running = False

    def leave_game(self, player):
        """
        Method to be called in websocket_disconnect().
        :param player:
        :return:
        """
        print(f"{player.username} is Leaving the Game.")
        self.players.remove(player)
        self.player_usernames.remove(player.username)
        del player
        if len(self.players) == 0:
            GameServer.current_games.remove(self)
            delete_object(self)

    def get_top_card(self):
        return self.topcard

    def get_current_player(self):
        return self.players[self.current_player_index]

    def prepare_client_data(self):
        """
        Method to return data to be sent to Client Side.
        :return: dictionary containing data to be sent to Client Side.
        """
        return {
            "uniqueId": self.unique_id,
            "players": self.player_usernames,
            "topCard": self.topcard,
            "direction": self.direction,
            "currentPlayerIndex": self.current_player_index
        }


class GameRoomConsumer(AsyncConsumer):
    """
        A Consumer which will consume (handle) events related to Game Room
    """

    async def websocket_connect(self, event):
        print("connected", event)
        unique_id = self.scope['url_route']['kwargs']['unique_id']
        self.me = self.scope['user']
        game_room_obj = await self.get_game_room(unique_id=unique_id)

        self.game_room_obj = game_room_obj

        player_obj = await self.get_player_obj()
        self.player_obj = player_obj

        # Uncomment if using reconnecting socket
        await self.set_is_online_true()

        game_room_id = f"game_room_{unique_id}"
        self.game_room_id = game_room_id

        self.player_server_obj = PlayerServer(username=self.me.username)
        self.game = GameServer.create_new_game(unique_id, self.player_server_obj)
        print(self.game)
        print(self.game.players)

        await self.channel_layer.group_add(
            game_room_id,
            self.channel_name
        )
        await self.send({
            "type": "websocket.accept"
        })

    async def websocket_receive(self, event):
        """
            Example event:
            event = {
                'type': 'websocket.receive',
                'text': '{
                    "type":"enter.room",
                    "text":{
                        "status":"connected",
                        "message": "<some_message>",
                        "data": {
                            // Some data
                        }
                    }
                }'
            }
        """
        print("received", event)
        front_text = event.get('text', None)
        if front_text:
            loaded_dict_data = json.loads(front_text)
            type_of_event = loaded_dict_data['type']
            text_of_event = loaded_dict_data['text']

            if type_of_event == "start.game":
                print(f"Before Broadcasting: Going to call start.game")
                self.game.start_game()
                print(f"Deck and Hands are Ready")
                await self.set_is_game_running_true()
            elif type_of_event == "end.game":
                self.game.end_game()
                await self.set_is_game_running_false()
            elif type_of_event == "play.card":
                data = text_of_event['data']
                card = data['card']
                index = data['index']
                username = data['username']
                card_obj = Card(card['category'], card['number'])
                current_player = self.game.get_current_player()
                if current_player.username != username or username != self.me.username:
                    print(f"Handle Cheating of {self.me.username}")
                if not current_player.is_card_in_hand(card_obj):
                    print(f"Handle Cheating of {self.me.username}")

                # Valid Move: Write this in a function
                self.game.deck.cards.insert(0, self.game.topcard)
                self.game.topcard = card_obj
                self.game.players[self.game.current_player_index].hand.pop(index)
                if card_obj.number == Card.REVERSE:
                    if self.game.direction == '+':
                        self.game.direction = '-'
                    else:
                        self.game.direction = '+'
                if self.game.direction == "+":
                    self.game.current_player_index += 1
                    if self.game.current_player_index == len(self.game.players):
                        self.game.current_player_index = 0
                else:
                    self.game.current_player_index -= 1
                    if self.game.current_player_index == -1:
                        self.game.current_player_index = len(self.game.players) - 1

            response = {
                "status": text_of_event['status'],
                "message": text_of_event['message'],
                "data": text_of_event['data'],
                "gameData": json.dumps(self.game.prepare_client_data(), cls=CustomEncoder),
            }

            # Broadcasts the enter_room event to be sent
            await self.channel_layer.group_send(
                self.game_room_id,
                {
                    "type": type_of_event,
                    "text": json.dumps(response)
                }
            )

    async def play_card(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def enter_room(self, event):
        # This method actually sends the message
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def broadcast_notification(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def start_game(self, event):
        text = event.get('text', None)
        if text:
            loaded_dict_data = json.loads(text)
            extra_data = {
                "serializedPlayer": json.dumps(self.player_server_obj, cls=CustomEncoder),
            }
            loaded_dict_data.update(extra_data)
            await self.send({
                "type": "websocket.send",
                "text": json.dumps(loaded_dict_data)
            })

    async def end_game(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def websocket_disconnect(self, event):
        print("disconnected", event)
        await self.set_is_online_false()
        me = self.me

        # Leaving current Game
        if len(self.game.players) == 1:
            await self.set_is_game_running_false()
        self.game.leave_game(self.player_server_obj)
        del self.player_server_obj

        response = {
            "status": "disconnected",
            "message": "Disconnecting...",
            "data": {
                "username": me.username,
                "pk": me.pk,
            },
        }
        await self.channel_layer.group_send(
            self.game_room_id,
            {
                "type": "leave.room",
                "text": json.dumps(response)
            }
        )
        await self.channel_layer.group_discard(
            self.game_room_id,
            self.channel_name
        )

    async def leave_room(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    @database_sync_to_async
    def set_is_online_false(self):
        player_obj = self.player_obj
        player_obj.is_online = False
        player_obj.save()

    @database_sync_to_async
    def set_is_online_true(self):
        player_obj = self.player_obj
        player_obj.is_online = True
        player_obj.save()

    @database_sync_to_async
    def get_game_room(self, unique_id):
        return GameRoom.objects.get(unique_game_id=unique_id)

    @database_sync_to_async
    def set_is_game_running_true(self):
        game_room_obj = self.game_room_obj
        game_room_obj.is_game_running = True
        game_room_obj.save()

    @database_sync_to_async
    def set_is_game_running_false(self):
        game_room_obj = self.game_room_obj
        game_room_obj.is_game_running = False
        game_room_obj.save()

    @database_sync_to_async
    def get_player_obj(self):
        me = self.me
        game_room_obj = self.game_room_obj
        return Player.objects.get(player=me, game_room=game_room_obj)
