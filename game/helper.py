import json
import math
import string
from json import JSONEncoder
import random
from django.conf import settings

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

    # Possible Numbers Will also be used for calculating score
    ZERO, ONE, TWO, THREE, FOUR = 0, 1, 2, 3, 4
    FIVE, SIX, SEVEN, EIGHT, NINE = 5, 6, 7, 8, 9
    SKIP, REVERSE, DRAW_TWO, NONE = 10, 11, 12, 13

    # Score of Action and Wild cards.
    WILD_SCORE, ACTION_SCORE = 50, 20

    def __init__(self, category, number):
        self.category = category
        self.number = number

    def is_equivalent(self, card):
        return self.category == card.category and self.number == card.number

    def get_category(self):
        return self.category

    def get_number(self):
        return self.number

    def is_number_card(self):
        return self.number < 10  # 0 - 9 are number cards.

    def is_skip(self):
        return self.number == Card.SKIP

    def is_reverse(self):
        return self.number == Card.REVERSE

    def is_draw_two(self):
        return self.number == Card.DRAW_TWO

    def is_wild(self):
        return self.category == Card.WILD

    def is_wild_four(self):
        return self.category == Card.WILD_FOUR

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

    def shuffle(self, times=1):
        """
        Method to Shuffle the Cards present in the Deck using Fisher Yates Shuffle algorithm.
        :return:
        """
        for _ in range(int(times)):
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
            
    def back_to_deck(self, card):
        self.cards.insert(0, card)


class PlayerServer:
    def __init__(self, username, rating_before_start):
        self.username = username
        self.rating_before_start = rating_before_start
        self.hand = []

        self.score = 0
        self.rating_change = 0

        self.yelled_uno = False
        self.seed = 0.0
        self.actual_rank = 0

    def draw(self, deck):
        """
        Method to draw card from the deck, add it to the hand.
        :param deck: Deck from which card is to be drawn.
        :return: drawn card
        """
        drawn_card = deck.deal()
        self.hand.append(drawn_card)
        return drawn_card

    def sort_hand(self):  # TODO: Look into this. This can create bugs as now hand can have None card.
        self.hand.sort(key=lambda x: x.category, reverse=True)

    def show(self):
        print(f"Username: {self.username}")
        for card in self.hand:
            if card is not None:
                card.show()

    def get_score(self):
        return int(self.score)

    def update_score(self, score):
        self.score += int(score)

    def get_hand_size(self):
        """
        Beware: Will also include count of None cards.
        :return:
        """
        return int(len(self.hand))

    def get_active_hand_size(self):
        """
        Calculates number of Not None cards in player's hand.
        :return: Count of Not None cards.
        """
        count = 0
        for card in self.hand:
            if card is not None:
                count += 1
        return count

    def is_card_in_hand(self, card, card_index):
        """
        Method to check whether card is at index card_index in player's hand or not.
        :param card: card which we want to check for.
        :param card_index: index which we want to look at.
        :return: true if found, otherwise false.
        """
        if card_index < self.get_hand_size():
            card_at_index = self.hand[card_index]
            if card_at_index is not None:
                if card.is_equivalent(card_at_index):
                    return True
        return False

    def __str__(self):
        return f"{self.username}"

    def get_hand(self):
        return self.hand

    def empty_hand(self, deck):
        for card in self.hand:
            if card is not None:
                deck.back_to_deck(card=card)
        self.hand = []


class GameServer:
    PUBLIC, CUSTOM = 0, 1
    PUBLIC_ROOM_LIMIT = 2
    WINNING_SCORE = int(settings.WINNING_THRESHOLD_SCORE)
    AVAILABLE_FRIEND_GAMES = []
    AVAILABLE_PUBLIC_GAMES = []
    # TODO: What will happen if deck runs out of cards. -- Kshitiz

    def __init__(self, unique_id, player, game_type, league=None):
        self.unique_id = unique_id
        self.game_type = game_type
        self.league = league
        self.admin_username = player.username
        self.players = []
        self.player_usernames = []
        self.players.append(player)
        self.player_usernames.append(player.username)
        self.deck = Deck()
        self.top_card = None
        self.top_color = None  # Required in case of WILD and WILD_FOUR cards.
        self.is_game_running = False
        self.direction = "+"
        self.current_player_index = 0
        self.previous_player_index = -1
        self.winner = None

    def __del__(self):
        print(f"Game with unique ID {self.unique_id} is deleted.")

    @classmethod
    def create_new_game(cls, unique_id, player, game_type, league):
        if game_type == cls.PUBLIC:
            for public_game in cls.AVAILABLE_PUBLIC_GAMES:
                if public_game.unique_id == unique_id:
                    if public_game.get_count_of_players() < 10:
                        print("Returning Existing Public Game.")
                        public_game.players.append(player)
                        public_game.player_usernames.append(player.username)
                        return public_game
                    return None
            print("Creating New Public Game.")
            new_public_game = GameServer(unique_id, player=player, game_type=game_type, league=league)
            cls.AVAILABLE_PUBLIC_GAMES.append(new_public_game)
            return new_public_game
        elif game_type == cls.CUSTOM:
            for friend_game in cls.AVAILABLE_FRIEND_GAMES:
                if friend_game.unique_id == unique_id:
                    if friend_game.get_count_of_players() < 10:
                        print("Returning Existing Custom Game.")
                        friend_game.players.append(player)
                        friend_game.player_usernames.append(player.username)
                        return friend_game
                    return None
            print("Creating New Custom Game.")
            new_friend_game = GameServer(unique_id, player=player, game_type=game_type, league=league)
            cls.AVAILABLE_FRIEND_GAMES.append(new_friend_game)
            return new_friend_game

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

    def start_new_round(self):
        """
        To start a new round when one player has emptied his hand.
        :return:
        """
        self.is_game_running = False
        self.start_game()

    def start_game(self):
        """
        Method to be called at the start of the game to shuffle and deal hands.
        :return:
        """
        if not self.is_game_running:
            self.deck.shuffle()
            self.deal_hands()
            self.top_card = self.choose_top_card()
            self.top_color = self.top_card.get_category()
            self.is_game_running = True
            for player in self.players:
                player.yelled_uno = False

            # Calculating Seed for players
            for player in self.players:
                player.seed = self.calculate_seed(player=player, rating=player.rating_before_start)

    def choose_top_card(self):
        """
        Chooses top card such that it is only Numbered Card.
        :return: Chosen top card
        """
        chosen_card = None
        for card in self.deck.cards:
            if card is not None:
                if card.is_number_card():
                    chosen_card = card
                    break
        self.deck.cards.remove(chosen_card)
        return chosen_card

    @staticmethod
    def get_elo_win_probability(a, b):
        return 1.0 / (1 + pow(10, (b - a) / 400.0))

    def calculate_seed(self, player, rating):
        """
        Method to calculate seed (expected rank) of player given a rating.
        :param player: Player whose seed is to be calculated
        :param rating: Rating based on which seed is to be calculated
        :return: Seed for player
        """
        seed = 1.0
        player_rating = int(rating)
        for opponent in self.players:
            if player.username != opponent.username:
                opponent_rating = int(opponent.rating_before_start)
                seed += GameServer.get_elo_win_probability(opponent_rating, player_rating)
        return seed

    def decide_winner(self):
        """
        Method to decide winner and calculate rating changes based on seed and actual rank.
        :return:
        """
        rank = 1
        if self.players:
            self.players.sort(key=lambda x: int(x.score), reverse=True)
            self.winner = self.players[0].username

            for player in self.players:
                # Assigning actual rank to players
                player.rank = float(rank)
                rank += 1
                geometric_mean = (player.rank * player.seed) ** 0.5

                # Using Binary Search to find rating r suck that this player will have seed == geometric_mean
                left, right = 1, 8000
                while right - left > 1:
                    mid = (left + right) // 2
                    if self.calculate_seed(player=player, rating=mid) < geometric_mean:
                        right = mid
                    else:
                        left = mid

                perceived_rating = left
                rating_change = (perceived_rating - int(player.rating_before_start))/2
                player.rating_change = int(rating_change)
                # Clearing Player's Hand as Winner is being decided.
                player.hand.clear()

    def end_game(self):
        """
        Method to be called at the end of the game to clear the hands of player and top_card of Game.
        :return:
        """
        if self.is_game_running:
            for player in self.players:
                delete_object(player)
                # if player.hand:
                #     for card in player.hand:
                #         if card is not None:
                #             self.deck.cards.append(card)
                #             player.hand.clear()

            if self.top_card:
                self.deck.cards.append(self.top_card)
                self.top_card = None

            self.is_game_running = False
            delete_object(self)

    def get_count_of_players(self):
        return int(len(self.players))

    def get_player_at(self, index):
        if index < self.get_count_of_players():
            return self.players[index]
        return None

    def leave_game(self, player):
        """
        Method to be called in websocket_disconnect().
        :param player:
        :return:
        """
        # Adding cards back to deck.
        for card in player.hand:
            self.deck.back_to_deck(card=card)
        player.hand = []
        self.players.remove(player)
        self.player_usernames.remove(player.username)
        delete_object(player)
        if len(self.players) == 0:
            delete_object(self)

    def calculate_score(self, player):
        """
        Method which calculates the score after winning ("Going Out").
        :param player: Player who has won this round.
        :return: Score
        """
        score = 0
        for game_player in self.players:
            if game_player != player:
                for card in game_player.hand:
                    if card is not None:
                        if card.is_number_card():
                            score += int(card.number)
                        elif card.is_wild() or card.is_wild_four():
                            score += int(Card.WILD_SCORE)
                        else:
                            score += int(Card.ACTION_SCORE)
        return score

    def get_top_card(self):
        return self.top_card

    def set_top_card(self, card):
        self.top_card = card

    def update_top_color(self, card, next_top_color):
        """
        Method to update self.top_color when a move is played.
        :param card:
        :param next_top_color:
        :return:
        """
        if card.is_wild() or card.is_wild_four():
            self.top_color = next_top_color
        else:
            self.top_color = card.category

    def reverse_direction(self):
        if self.direction == '+':
            self.direction = '-'
        elif self.direction == '-':
            self.direction = '+'

    def update_direction(self, card):
        """
        Method to update self.direction if Reverse Card is played.
        :param card: card which is played
        :return:
        """
        if card.is_reverse():
            self.reverse_direction()

    def increment_or_decrement_current_player_index(self, amount):
        """
        To increment or decrement current player index by amount according to self.direction.
        :param amount: amount by which increment or decrement should happen
        :return: Updated value of current player index
        """
        count = self.get_count_of_players()
        if self.direction == '+':
            return (self.current_player_index + amount) % count
        elif self.direction == '-':
            return (self.current_player_index - amount + count) % count

    def update_current_player_index(self, card):
        """
        Method to update self.current_player_index when a card is played.
        Always call this after self.update_direction()
        :param card: card which is played
        :return:
        """
        previous_player = self.get_previous_player()

        if card.is_skip() or card.is_draw_two() or card.is_wild_four():
            # Next Player misses turn. Increment/Decrement by 2.
            amount = 2
        elif card.is_reverse() and self.get_count_of_players() == 2:
            # If there are only two players, Reverse acts as Skip card.
            amount = 2
        else:
            # Increment/Decrement by 1.
            amount = 1

        # Setting previous player as current player
        self.previous_player_index = self.current_player_index
        # Updating current player
        self.current_player_index = self.increment_or_decrement_current_player_index(amount=amount)

        current_player = self.get_current_player()
        # If previous player has only 1 card left and didn't yell UNO but also didn't get caught.
        if previous_player is not None:
            if previous_player.username != current_player.username:  # Added for special case when 2 players are playing.
                if previous_player.get_active_hand_size() == 1:
                    if not previous_player.yelled_uno:  # TODO: Sometimes catching does not work.
                        previous_player.yelled_uno = True

    def get_current_player(self):
        return self.players[self.current_player_index]

    def get_previous_player(self):
        """
        Method to return previous player.
        :return:
        """
        if self.previous_player_index != -1:
            return self.players[self.previous_player_index]
        return None

    def prepare_client_data(self):
        """
        Method to return data to be sent to Client Side.
        :return: dictionary containing data to be sent to Client Side.
        """
        return {
            "uniqueId": self.unique_id,
            "players": self.player_usernames,
            "topCard": self.top_card,
            "topColor": self.top_color,
            "direction": self.direction,
            "currentPlayerIndex": self.current_player_index,
            "adminUsername": self.admin_username,
            "gameType": self.game_type,
        }

    def can_play_over_top(self, player, card):
        """
        Method to tell whether player can play this card over self.top_card or not.
        Similar method is also defined on Client Side.
        :param player: Player who is playing the card.
        :param card: Card which has to be played
        :return: True if yes, otherwise false
        """
        # Segregating card's data.
        category, number = card.category, card.number

        # Fetching current top_card and segregating it's data.
        top_card = self.get_top_card()
        top_card_category, top_card_number = top_card.category, top_card.number

        if category != Card.WILD_FOUR:
            return category == self.top_color or number == top_card_number or category == Card.WILD
        elif category == Card.WILD_FOUR:
            # Fetching players hand.
            hand = player.get_hand()
            for hand_card in hand:
                if hand_card is None:
                    continue
                if hand_card.category != Card.WILD_FOUR:
                    if self.can_play_over_top(player=player, card=hand_card):
                        return False
            return True

    def is_valid_play_move(self, client_data, server_data):

        # Segregating Client Side Data
        client_card, client_card_index = client_data['card'], client_data['index']
        client_username, client_next_top_color = client_data['username'], client_data['next_top_color']

        # Segregating Server Side Data
        server_username = server_data['username']

        # Making card object based on client_card
        client_card_obj = Card(client_card['category'], client_card['number'])

        # Fetching current player as stored on the server
        server_current_player = self.get_current_player()
        if server_current_player.username != client_username:
            print(f"Cheating: ServerCurrentPlayer({server_current_player.username}) != ClientPlayer({client_username})!")
            return False

        if client_username != server_username:
            print(f"Cheating: ServerPlayer({server_username}) != ClientPlayer({client_username})!")
            return False

        if not server_current_player.is_card_in_hand(card=client_card_obj, card_index=client_card_index):
            # If client_card is not present at client_index in server's data of player's hand.
            print(f"Cheating: ClientCard({client_card_obj.show()}) != Card At This Index In {server_username}'s Hand)")
            return False

        can_play = self.can_play_over_top(player=server_current_player, card=client_card_obj)
        if can_play is False:
            # Trying to play card which can not be played over top card.
            print(f"Cheating: ClientCard({client_card_obj.show()}) can't be played over TopCard({self.top_card.show()})")
            return False
        return True

    def play_card(self, client_data):
        """
        Method to play a card when play.card event is consumed. Will be called only if this move is valid.
        :param client_data: data about the move i.e. username, card and index of card
                            in player's hand coming from Client Side
        :return:
        """
        # Segregating Client Side Data
        client_card, client_card_index = client_data['card'], client_data['index']
        client_username, client_next_top_color = client_data['username'], client_data['next_top_color']

        # Fetching client_player_object/current_player_object
        current_player_obj = self.get_current_player()

        # Making card object based on client_card
        client_card_obj = Card(client_card['category'], client_card['number'])

        # print("Client Card OBJ: ", client_card_obj.show())
        # print()

        # Getting next player's index. To be used in case this card is Draw Two or Wild Four.
        skipped_player_index = self.increment_or_decrement_current_player_index(amount=1)

        # Removing played card from the player's hand.
        # self.players[self.current_player_index].hand.pop(client_card_index)
        self.players[self.current_player_index].hand[client_card_index] = None

        # Putting current top card back in deck.
        self.deck.back_to_deck(card=self.top_card)

        # Updating top card.
        self.set_top_card(card=client_card_obj)

        # Updating top color.
        self.update_top_color(card=client_card_obj, next_top_color=client_next_top_color)

        # Updating direction.
        self.update_direction(card=client_card_obj)

        # Updating current player index. Always To be done after updating direction.
        self.update_current_player_index(card=client_card_obj)

        # Check if this player has won the game.
        won_data = None
        if current_player_obj.get_active_hand_size() == 0:
            current_player_obj.update_score(self.calculate_score(current_player_obj))

            # Emptying Hands of other player.
            for player in self.players:
                player.empty_hand(deck=self.deck)

            self.deck.shuffle(times=1)
            self.top_card = None
            self.top_color = None
            self.direction = '+'
            self.current_player_index = 0
            if current_player_obj.get_score() >= GameServer.WINNING_SCORE:
                self.decide_winner()
                won_data = {
                    "status": "won",
                    "username": self.winner,
                    "score": current_player_obj.get_score(),
                }

            else:
                # When current player has emptied his hand.
                won_data = {
                    "status": "won",
                    "username": current_player_obj.username,
                    "score": current_player_obj.get_score(),
                }
                self.start_new_round()
            print(f"{current_player_obj.username} won this round with score = {current_player_obj.get_score()}.")

        if won_data:
            return won_data

        skipped_player = None
        drawn_cards = []
        if client_card_obj.is_draw_two() or client_card_obj.is_wild_four():
            skipped_player = self.get_player_at(index=skipped_player_index)
            draw_count = 0
            # If the played card was Draw Two
            if client_card_obj.is_draw_two():
                draw_count = 2

            # If the played card was Wild Four
            if client_card_obj.is_wild_four():
                draw_count = 4

            for _ in range(draw_count):
                drawn_cards.append(skipped_player.draw(self.deck))

                skipped_player.yelled_uno = False

        if skipped_player is not None:
            response = {
                "status": "skipped",
                "username": skipped_player.username,
                "drawnCards": json.dumps(drawn_cards, cls=CustomEncoder),
                "drawnCardCount": int(len(drawn_cards)),
            }
        else:
            response = None
        return response

    def is_valid_draw_move(self, client_data, server_data):
        # Segregating Client Side Data
        client_username = client_data['username']

        # Segregating Server Side Data
        server_username = server_data['username']

        # Fetching current player as stored on the server
        server_current_player = self.get_current_player()
        if server_current_player.username != client_username:
            print(
                f"Cheating: ServerCurrentPlayer({server_current_player.username}) != ClientPlayer({client_username})!")
            return False

        if client_username != server_username:
            print(f"Cheating: ServerPlayer({server_username}) != ClientPlayer({client_username})!")
            return False

        return True

    def draw_card(self):

        # Fetching current player as stored on the server
        server_current_player = self.get_current_player()

        server_current_player.yelled_uno = False

        # Draw the card.
        drawn_card = server_current_player.draw(self.deck)

        # Directly Moving to next player if this card cannot be played.
        if not self.can_play_over_top(player=server_current_player, card=drawn_card):
            # Set current player as the previous player
            self.previous_player_index = self.current_player_index
            # Updating current player
            self.current_player_index = self.increment_or_decrement_current_player_index(amount=1)

        response = {
            "username": server_current_player.username,
            "drawnCard": json.dumps(drawn_card, cls=CustomEncoder),
        }
        return response

    def keep_card(self):
        """
        This method is called when a player decides to keep a card after drawing from the deck.
        It updates the current_player_index to next player.
        :return:
        """
        # Fetching current player as stored on the server
        server_current_player = self.get_current_player()

        server_current_player.yelled_uno = False

        # Set current player as the previous player
        self.previous_player_index = self.current_player_index

        # Updating current player
        self.current_player_index = self.increment_or_decrement_current_player_index(amount=1)

    def can_call_uno(self, client_data, server_data):
        # Segregating Client Side Data
        client_username = client_data['username']

        # Segregating Server Side Data
        server_username = server_data['username']

        # Fetching current player as stored on the server
        server_current_player = self.get_current_player()
        server_previous_player = self.get_previous_player()

        if server_current_player.username != client_username and server_previous_player.username != client_username:
            print(f"Cheating: ServerCurrentPlayer({server_current_player.username}) or ServerPreviousPlayer({server_previous_player.username} != ClientPlayer({client_username})!")
            return False

        if client_username != server_username:
            print(f"Cheating: ServerPlayer({server_username}) != ClientPlayer({client_username})!")
            return False

        count = server_current_player.get_active_hand_size()

        if client_username == server_current_player.username and server_current_player.username == server_previous_player.username:
            if count <= 2:
                return True

        if client_username == server_current_player.username and server_current_player.username != server_previous_player.username and count != 2:
            print(f"Current Player {server_current_player.username} is trying to call UNO! But his/her card count({count}) != 2")
            return False

        count = server_previous_player.get_active_hand_size()

        if client_username == server_previous_player.username and count != 1:
            print(f"Previous Player {server_previous_player.username} is trying to call UNO! But his/her card count({count}) != 1")
            return False

        return True

    def call_uno(self, client_data):
        # Fetching player's username name of player who yelled uno.
        uno_call_player = client_data['username']

        # Fetching current player as stored on the server
        server_current_player = self.get_current_player()

        # Fetching previous player as stored on the server
        server_previous_player = self.get_previous_player()

        if uno_call_player == server_previous_player.username:
            server_previous_player.yelled_uno = True
        elif uno_call_player == server_current_player.username:
            server_current_player.yelled_uno = True

    def is_valid_catch(self, client_data, server_data):
        client_catcher = client_data['catcher']
        client_caught = client_data['caught']

        server_catcher = server_data['catcher']
        server_caught = server_data['caught']

        if client_catcher != server_catcher:
            print(f"Client Catcher({client_catcher}) != Server Catcher({server_catcher})")
            return False

        if client_caught != server_caught:
            print(f"Client Caught({client_caught}) != Server Caught({server_caught})")
            return False

        server_previous_player = self.get_previous_player()

        if server_previous_player.yelled_uno:  # Player has already yelled UNO!
            print(f"Caught({client_caught}) already yelled uno!")
            return False

        count = server_previous_player.get_active_hand_size()

        if server_previous_player.get_active_hand_size() > 1:
            print(f"Caught({client_caught}) has more than 1 ({count}) cards{json.dumps(server_previous_player.get_hand(), cls=CustomEncoder)}.")
            return False

        return True

    def catch_player(self):

        server_caught_player = self.get_previous_player()

        drawn_cards = []
        draw_count = 2

        for _ in range(draw_count):
            drawn_cards.append(server_caught_player.draw(self.deck))

        server_caught_player.yelled_uno = False

        response = {
            "drawnCards": json.dumps(drawn_cards, cls=CustomEncoder),
        }
        return response

    def can_time_out(self, client_data, server_data):
        client_username = client_data['username']
        server_username = server_data['username']

        server_current_player = self.get_current_player()

        if client_username != server_username:
            print(f"Client user({client_username}) != Server user({server_username}).")
            return False

        if client_username != server_current_player.username:
            print(f"Client User({client_username}) != Server Current Player({server_username})")
            return False

        return True

    def time_out(self):
        server_current_player = self.get_current_player()

        # Drawing two cards for current player
        drawn_cards = []
        draw_count = 2

        for _ in range(draw_count):
            drawn_cards.append(server_current_player.draw(self.deck))

        server_current_player.yelled_uno = False

        response = {
            "drawnCards": json.dumps(drawn_cards, cls=CustomEncoder),
        }

        # Setting previous player
        self.previous_player_index = self.current_player_index

        # Setting current player
        self.current_player_index = self.increment_or_decrement_current_player_index(amount=1)

        return response
