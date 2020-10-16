import random
import asyncio
import json
from json import JSONEncoder
from django.contrib.auth import get_user_model

# from the channels module
from channels.consumer import AsyncConsumer
from channels.db import database_sync_to_async

# from the models
from .models import Bot
from game.models import Card

class CustomEncoder(JSONEncoder):
    def default(self, o):
        return o.__dict__


class UnoCard:
    def __init__(self, category, number):
        self.category = category
        self.number = number

    def show_card(self):
        return f"{self.number} of {self.category}"


class UnoDeckServer:

    def __init__(self):
        self.cards = []
        self.build()

    def build(self):
        """
        Method to build the Deck of Cards or Populate the Deck with Cards.
        :return:
        """
        for category in [Card.BLUE, Card.GREEN, Card.YELLOW, Card.RED]:
            self.cards.append(UnoCard(category=category, number=Card.ZERO))

            for number in [Card.ONE, Card.TWO, Card.THREE, Card.FOUR, Card.FIVE, Card.SIX, Card.SEVEN, Card.EIGHT,
                           Card.NINE, Card.SKIP, Card.REVERSE, Card.DRAW_TWO]:
                self.cards.append(UnoCard(category=category, number=number))
                self.cards.append(UnoCard(category=category, number=number))

        for i in range(4):
            self.cards.append(UnoCard(category=Card.WILD, number=Card.NONE))
            self.cards.append(UnoCard(category=Card.WILD_FOUR, number=Card.NONE))

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

class PlayerState:
    def __init__(self, player, cards):
        self.player = player # a string representing username of player
        self.cards = cards # list of objects of Class UnoCard representing hand of the player
        self.allowed_cards = [] # list of string of card values representing allowed card plays for the player as per current bot_game_state

    def show_player_state(self):
        state = ''
        for card in self.cards:
            state += "[" + card.show_card() + "] "
        return f"{self.player} is having {state} cards."

    def get_all_cards(self):
        cards_list = []
        for card in self.cards:
            cards_list.append(card.show_card())
        return cards_list

    def __str__(self):
        return f"{self.show_player_state()}"


class BotGameState:
    def __init__(self, bot_game_room, bot_id, player):
        self.bot_game_room = bot_game_room # a string representing unique game room
        self.player = player # a string representing username of player
        self.bot = bot_id # a string representing id of bot
        self.deck = UnoDeckServer() # object of UnoDeckServer Class
        random.shuffle(self.deck.cards)
        self.top_card = None # Object of UnoCard Class
        self.set_top_card()

    def set_top_card(self):
        print("Setter Called")
        numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
        colors = ['R', 'G', 'B', 'Y']
        number = random.choice(numbers)
        category = random.choice(colors)
        card_value = f"{number} of {category}"
        valid_deletion = 0  # Just for debugging
        for card in self.deck.cards:
            if card.show_card() == card_value:
                self.top_card = card
                valid_deletion = 1
                self.deck.cards.remove(card)
                break
        if valid_deletion:
            print("Card removed Successfully")
        else:
            print("Something went Wrong with the Card")

    def get_top_card(self):
        if self.top_card is not None:
            return self.top_card.show_card()
        else:
            print("Top Card Getter called at wrong time...")

    def show_game_state(self):
        return f"bot_{self.bot} is playing with {self.player} and current_top_card is [{self.top_card.show_card()}]"

    def __str__(self):
        return f"{self.show_game_state()}"


def get_playable_cards(player_state, bot_game_state):
    cards = player_state.cards
    category = bot_game_state.top_card.category
    number = bot_game_state.top_card.number
    player_state.allowed_cards = []
    for card in cards:
        if card.category in ['W', 'WF']:
            player_state.allowed_cards.append(card.show_card())
        elif str(card.number) == str(number):
            player_state.allowed_cards.append(card.show_card())
        elif card.category == category:
            player_state.allowed_cards.append(card.show_card())
    return player_state.allowed_cards

def update_state_request(player_card_value, player_state, bot_game_state):
    if player_card_value == "DRAW_CARD":
        if not len(bot_game_state.deck.cards):
            print("DECK EXHAUSTED!!!")
            return
        drawn_card_object = bot_game_state.deck.deal()
        print("Card Drawn from the Deck is", drawn_card_object.show_card())
        player_state.cards.append(drawn_card_object)
        return

    number, category = player_card_value.split(" of ")
    valid_card = False

    for card in player_state.allowed_cards:
        if card == player_card_value:
            player_state.allowed_cards.remove(card)
            bot_game_state.top_card = UnoCard(category, number)
            valid_card = True
            break

    if valid_card:
        try:
            # Watch out you should compare the value of the Object then remove, because objects as such wont match.
            cards = player_state.cards
            for card in cards:
                if card.show_card() == bot_game_state.top_card.show_card():
                    player_state.cards.remove(card)
                    break
        except:
            print("WHOA! This should not Happen!")
    else:
        print("WHOA! This should not Happen Too")


def bot_decide_card(bot_state):
    '''
    :param bot_state:
    :return: string representing the card to play or DRAW_CARD
    '''

    if len(bot_state.allowed_cards):
        print("Bot Played", bot_state.allowed_cards[0])
        return bot_state.allowed_cards[0]
    else:
        print("Bot Played DRAW_CARD")
        return "DRAW_CARD"


def bot_play_card(bot_state, bot_game_state):
    '''
    :param bot_state: it will be updated as per the card played by the bot
    :param bot_game_state: bot_game_state.top_card value will be updated
    :return:
    '''
    bot_state.allowed_cards = get_playable_cards(bot_state, bot_game_state)
    card_to_move = bot_decide_card(bot_state)
    if card_to_move == "DRAW_CARD":
        if not len(bot_game_state.deck.cards):
            print("DECK EXHAUSTED!!!")
            return
        drawn_card_object = bot_game_state.deck.deal()
        print("Card Drawn from the Deck is", drawn_card_object.show_card())
        bot_state.cards.append(drawn_card_object)
        return card_to_move
    else:
        try:
            bot_state.allowed_cards.remove(card_to_move)
            for card in bot_state.cards:
                if card.show_card() == card_to_move:
                    bot_state.cards.remove(card)
                    bot_game_state.top_card = card
                    break
        except:
            print("How not Present in Allowed Cards?")
    return card_to_move


class BotGameServer:
    '''
        Creates a game.
    '''
    current_games = {}

    def __init__(self, bot_id, player, bot_game_room):
        # print("Constructor Called From Cls")
        self.bot_state = PlayerState(bot_id, [])
        self.player_state = PlayerState(player, [])
        self.bot_game_state = BotGameState(bot_game_room, bot_id, player)
        self.deal_hands()

    @classmethod
    def create_bot_game(cls, bot_id, player, bot_game_room):
        if cls.current_games.get(bot_game_room) is None:
            cls.current_games[bot_game_room] = cls(bot_id, player, bot_game_room)
        return cls.current_games[bot_game_room]

    @classmethod
    def delete_bot_game(cls, bot_game_room):
        if cls.current_games.get(bot_game_room) is not None:
            del cls.current_games[bot_game_room]

    def deal_hands(self, cards_per_player=7):
        """
        Method to deal hands to all the connected players from the deck of this Game.
        :param cards_per_player:
        :return:
        """
        for i in range(int(cards_per_player)):
            self.bot_state.cards.append(self.bot_game_state.deck.deal())
        for i in range(int(cards_per_player)):
            self.player_state.cards.append(self.bot_game_state.deck.deal())


class BotGameConsumer(AsyncConsumer):
    player = None
    bot_game_room = None
    bot = None
    game = None

    async def websocket_connect(self, event):
        print("Accepting an handshake request", event)
        # accepting the Handshake or Upgrade from HTTP to WebSocket
        await self.send({
            "type": "websocket.accept",
        })
        player = self.scope['user']
        self.player = player
        bot_instance = await self.get_bot_for_username(player)
        self.bot = bot_instance
        bot_id = None
        if bot_instance is None:
            # This means that there are no Talks between the two Yet
            # Need to Create new Thread for the dual and then asssign thread_id
            print("WTH this should not Happen!")
            pass
        else:
            bot_id = bot_instance.id

        bot_game_room = f"bot_{bot_id}_{player}"  # This is Just a name given to our Bot-Game-Room
        self.bot_game_room = bot_game_room
        # print(bot_game_room)
        # print(self.channel_name)

        # Creating the Game room
        await self.channel_layer.group_add(
            self.bot_game_room,  # Name of the Bot-Game-Room
            self.channel_name  # Name of the Channel
        )
        self.game = BotGameServer.create_bot_game(bot_id=bot_id, player=player, bot_game_room=bot_game_room)

        server_response = {
            "player_state": json.dumps(self.game.player_state.get_all_cards()),
            "bot_state": json.dumps(self.game.bot_state.get_all_cards()),
            "bot_game_state": json.dumps(self.game.bot_game_state.get_top_card()),
            "playable_cards": get_playable_cards(self.game.player_state, self.game.bot_game_state),
            "bot_played_cards": []
        }

        await self.channel_layer.group_send(
            self.bot_game_room,  # name of the Chat root
            {
                'type': "send_to_player",
                'text': json.dumps(server_response)
            }
        )

    async def websocket_receive(self, event):
        # When a message is received from the Websocket
        data_received_dict = json.loads(event.get('text', None))
        card_played_value = data_received_dict.get('card_played_value')
        print("Card played by Client is ", card_played_value)

        if card_played_value == 'DRAW_CARD':
            print("DRAW_CARD was played")
            update_state_request("DRAW_CARD", self.game.player_state, self.game.bot_game_state)
        elif card_played_value == 'END_GAME':
            BotGameServer.delete_bot_game(self.game.bot_game_state.bot_game_room)
        else:
            number, category = card_played_value.split(" of ")
            print("Number and Category of Card Played by Player:", number, category)
            update_state_request(card_played_value, self.game.player_state, self.game.bot_game_state)
            if number == '10' or number == '11':  # Skip or Reverse => Bot is not allowed to play
                print("Player Played Skip")
                server_response = {
                    "player_state": json.dumps(self.game.player_state.get_all_cards()),
                    "bot_state": json.dumps(self.game.bot_state.get_all_cards()),
                    "bot_game_state": json.dumps(self.game.bot_game_state.get_top_card()),
                    "playable_cards": get_playable_cards(self.game.player_state, self.game.bot_game_state),
                    "bot_played_cards": []
                }

                await self.channel_layer.group_send(
                    self.bot_game_room,  # name of the Chat root
                    {
                        'type': "send_to_player",
                        'text': json.dumps(server_response)
                    }
                )
                return

        # Now Bot will Play:-
        bot_played_cards = []

        while True:
            played_card = bot_play_card(self.game.bot_state, self.game.bot_game_state)
            bot_played_cards.append(played_card)
            if played_card == "DRAW_CARD":
                break
            else:
                number, category = played_card.split(" of ")
                if number == '10' or number == '11':  # Skip or Reverse
                    continue
                else:
                    break

        # the response we need to send to the group through the channel layers
        server_response = {
            "player_state": json.dumps(self.game.player_state.get_all_cards()),
            "bot_state": json.dumps(self.game.bot_state.get_all_cards()),
            "bot_game_state": json.dumps(self.game.bot_game_state.get_top_card()),
            "playable_cards": get_playable_cards(self.game.player_state, self.game.bot_game_state),
            "bot_played_cards": bot_played_cards
        }

        await self.channel_layer.group_send(
            self.bot_game_room,  # name of the Chat root
            {
                'type': "send_to_player",
                'text': json.dumps(server_response)
            }
        )

    # my custom event
    async def send_to_player(self, event):
        await self.send({
            'type': "websocket.send",
            'text': event.get('text')
        })

    async def websocket_disconnect(self, event):
        print("[PRINTED]:- Websocket Connection has been Disconnected", event)
        # if self.game is not None:
        #     del BotGameServer.current_games[self.bot_game_room]

    @database_sync_to_async
    def get_bot_for_username(self, player):
        return Bot.objects.get_bot_for_username(player)
