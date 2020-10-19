import json
from json import JSONEncoder
import random


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
    def __init__(self, username):
        self.username = username
        self.score = 0
        self.hand = []

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
    WINNING_SCORE = 150
    current_games = []
    # TODO: What will happen if deck runs out of cards. -- Kshitiz

    def __init__(self, unique_id, player):
        self.unique_id = unique_id
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
        self.winner = None

    def __del__(self):
        print(f"Game with unique ID {self.unique_id} is deleted.")

    @classmethod
    def create_new_game(cls, unique_id, player):
        for game in cls.current_games:
            if game.unique_id == unique_id:
                # print("Returning Existing Game.")
                game.players.append(player)
                game.player_usernames.append(player.username)
                return game
        # print("Creating New Game.")
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

    def decide_winner(self):
        max_score = -1
        winner = None
        for player in self.players:
            if player.score > max_score:
                max_score = player.score
                winner = player.username
        self.winner = winner

    def end_game(self):
        """
        Method to be called at the end of the game to clear the hands of player and top_card of Game.
        :return:
        """
        if self.is_game_running:
            for player in self.players:
                if player.hand:
                    for card in player.hand:
                        if card is not None:
                            self.deck.cards.append(card)
                            player.hand.clear()

            if self.top_card:
                self.deck.cards.append(self.top_card)
                self.top_card = None

            self.is_game_running = False

            self.decide_winner()

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
        self.players.remove(player)
        self.player_usernames.remove(player.username)
        delete_object(player)
        if len(self.players) == 0:
            GameServer.current_games.remove(self)
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
        if card.is_skip() or card.is_draw_two() or card.is_wild_four():
            # Next Player misses turn. Increment/Decrement by 2.
            amount = 2
        elif card.is_reverse() and self.get_count_of_players() == 2:
            # If there are only two players, Reverse acts as Skip card.
            amount = 2
        else:
            # Increment/Decrement by 1.
            amount = 1
        self.current_player_index = self.increment_or_decrement_current_player_index(amount=amount)

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
            "topCard": self.top_card,
            "topColor": self.top_color,
            "direction": self.direction,
            "currentPlayerIndex": self.current_player_index,
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
                self.end_game()
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

        # Draw the card.
        drawn_card = server_current_player.draw(self.deck)

        # Directly Moving to next player if this card cannot be played.
        if not self.can_play_over_top(player=server_current_player, card=drawn_card):
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

        # Set current player as the next player
        self.current_player_index = self.increment_or_decrement_current_player_index(amount=1)
