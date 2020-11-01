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

    def deal(self, card_to_draw=None):
        """
        :param card_to_draw: A string representing the card to draw
        :return:
        """
        if card_to_draw is not None:
            # used when we want to remove the Cars of the bot, player and top card for getting the new deck
            for card in self.cards:
                if card.show_card() == card_to_draw:
                    self.cards.remove(card)
                    break
        else:
            return self.cards.pop()

    def show(self):
        for card in self.cards:
            card.show()


class PlayerState:
    def __init__(self, player, cards):
        self.player = player  # a string representing username of player
        self.cards = cards  # list of objects of Class UnoCard representing hand of the player
        self.allowed_cards = []  # list of string of card values representing allowed card plays for the player as per current bot_game_state

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
    """
    Properties/State:
        1. bot_game_room i.e. name of the room in which game is being played
        2. player i.e. username of the player playing with bot
        3. bot i.e. id of the bot playing
        4. deck i.e. List of Card objects representing the deck of the game
        5. top_card i.e. the current top card of the game
        6. top_card_type i.e. the type of color changing card 1 for WF, 0 for W
    """
    def __init__(self, bot_game_room, bot_id, player, bot_level, player_draws_count_list):
        self.bot_game_room = bot_game_room  # a string representing unique game room
        self.player = player  # a string representing username of player
        self.bot = bot_id  # a string representing id of bot
        self.deck = UnoDeckServer()  # object of UnoDeckServer Class
        self.bot_level = bot_level # 0 means easy and 1 means medium
        self.player_draws_count_list = player_draws_count_list # List containing 4 numbers. Draws on Red, Green, Blue and Yellow Colors Respectively.
        random.shuffle(self.deck.cards)
        self.top_card = None  # Object of UnoCard Class
        self.top_card_type = 0 # This value is valid only if the self.top_card.number is 13. 0 => W and 1 => WF
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
            print("Card removed from Deck and Set as Top Card.")
        else:
            print("Something went Wrong when removing card from Deck to set as Top Card")

    def get_top_card(self):
        """
            This function will send the correct card value of the top_card
            For e.g. the top_card value can be 13 of G => in that case it will return 13 of W or 13 of WF depending 
            on which card made the color to chnage
        """
        if self.top_card is not None:
            if str(self.top_card.number) == '13':
                if self.top_card_type == 0:
                    return "13 of W"
                else:
                    return "13 of WF"
            else:
                return self.top_card.show_card()
        else:
            print("Top Card Getter called at wrong time...")


    def show_game_state(self):
        return f"bot_{self.bot} is playing with {self.player} and current_top_card is [{self.top_card.show_card()}]"

    def __str__(self):
        return f"{self.show_game_state()}"


def recover_deck(player_state, bot_game_state, bot_state):
    # print("Recovering the Deck")
    bot_game_state.deck = UnoDeckServer()  # Getting a new Deck
    # Removing the Current Top Card
    random.shuffle(bot_game_state.deck.cards)
    print("length of new deck-rd:", len(bot_game_state.deck.cards))
    bot_game_state.deck.deal(bot_game_state.get_top_card())
    # print("Removed top card")
    print("length of new deck-rd-at:", len(bot_game_state.deck.cards))
    for card in player_state.cards:
        bot_game_state.deck.deal(card.show_card())
    # print("Removed player cards")
    print("length of new deck-rd-ap:", len(bot_game_state.deck.cards))
    for card in bot_state.cards:
        bot_game_state.deck.deal(card.show_card())
    # print("Removed bot cards")
    print("length of new deck-rd-ab:", len(bot_game_state.deck.cards))


def can_play_wild_four(player_state, top_color):
    """
    helper function that tells if the player with player_state can play its WF or not
    """
    for card in player_state.cards:
        if card.category == top_color:
            # print("Cannot Play Wild Four")
            return 0
    # print("Can Play Wild Four")
    return 1


def get_playable_cards(player_state, bot_game_state, top_color=None):
    """
    return: A List of Cards(in string format) containing all the playable cards of the player_state passed as argument
    """
    cards = player_state.cards
    category = bot_game_state.top_card.category
    number = bot_game_state.top_card.number
    player_state.allowed_cards = []
    if top_color is None:
        top_color = category
    for card in cards:
        if card.category in ['W']:
            player_state.allowed_cards.append(card.show_card())
        if card.category in ['WF']:
            if can_play_wild_four(player_state, top_color):
                player_state.allowed_cards.append(card.show_card())
        elif str(card.number) == str(number):
            player_state.allowed_cards.append(card.show_card())
        elif card.category == top_color:
            player_state.allowed_cards.append(card.show_card())
    return player_state.allowed_cards



def check_drawn_card_playable(drawn_card_object, player_state, bot_game_state):
    category = bot_game_state.top_card.category
    number = bot_game_state.top_card.number
    drawn_card_category = drawn_card_object.category
    drawn_card_number = drawn_card_object.number

    if drawn_card_category in ['W']:
        return True
    elif drawn_card_category in ['WF']: 
        if can_play_wild_four(player_state, bot_game_state.top_card.category) == 1:
            return True
        else:
            return False
    elif str(drawn_card_number) == str(number):
        return True
    elif (drawn_card_category) == str(category):
        return True
    else:
        return False


def update_state_request(player_card_value, player_state, bot_game_state, bot_state):
    """
        This function updates the player_state[Removes the played card from hand] and the game_state[Changes the Top Card]
        This function is Called in the player's context only i.e. never called by Bot
    """
    if player_card_value == "DRAW_CARD":
        # Update bot_game_state.player_draws_count_list 
        if bot_game_state.top_card.category == 'R':
            bot_game_state.player_draws_count_list[0]+=1
        elif bot_game_state.top_card.category == 'G':
            bot_game_state.player_draws_count_list[1]+=1
        elif bot_game_state.top_card.category == 'B':
            bot_game_state.player_draws_count_list[2]+=1
        else:
            bot_game_state.player_draws_count_list[3]+=1

        if not len(bot_game_state.deck.cards):
            print("DECK EXHAUSTED!!!")
            recover_deck(player_state, bot_game_state, bot_state)
            print("Deck Recovered")
            print("length of new deck-usr:", len(bot_game_state.deck.cards))
        drawn_card_object = bot_game_state.deck.deal()
        print("Card Drawn from the Deck is", drawn_card_object.show_card())
        is_drawn_card_playable = check_drawn_card_playable(drawn_card_object, player_state, bot_game_state)
        if is_drawn_card_playable:
            player_state.cards.append(drawn_card_object)
            print('Drawn Card is Playable')
            return drawn_card_object
        else:
            player_state.cards.append(drawn_card_object)
            print('Drawn Card is Not Playable')
            return None
    else:
        number, category = player_card_value.split(" of ")
        valid_card = False
        for card in player_state.allowed_cards:
            if card == player_card_value:
                player_state.allowed_cards.remove(card)
                bot_game_state.top_card = UnoCard(category, number)
                if number == '13':
                    if category == 'W':
                        bot_game_state.top_card_type = 0 # W 
                    else:
                        bot_game_state.top_card_type = 1 # WF
                valid_card = True
                break
        if valid_card:
            try:
                # Watch out you should compare the value of the Object then remove, because objects as such wont match.
                cards = player_state.cards
                for card in cards:
                    if card.show_card() == bot_game_state.get_top_card(): # Comparing with the new top_card
                        player_state.cards.remove(card)
                        return None
            except:
                print("WHOA! This should not Happen!")
        else:
            print("WHOA! This should not Happen Too")


def update_other_player_state_only(number, other_player_state, bot_game_state, player_state):
    """
    This function is used to update the other_player_state as per the card played by the player.
    It is called only when the category of card played is either "DT" or "WF"
    :param number: denotes whether the card played by the player is "W" or "WF"
    :param other_player_state:
    :param bot_game_state:
    :param player_state:
    :return:
    """
    if number == '12':  # DRAW_TWO was played by the player
        print("DRAW_TWO was played by the player")
        if len(bot_game_state.deck.cards) < 2:
            print("DECK EXHAUSTED!!!")
            recover_deck(other_player_state, bot_game_state, player_state)
        # Drawing First Card
        drawn_card_object = bot_game_state.deck.deal()
        print("Card Drawn from the Deck is", drawn_card_object.show_card())
        other_player_state.cards.append(drawn_card_object)
        # Drawing Second Card
        drawn_card_object = bot_game_state.deck.deal()
        print("Card Drawn from the Deck is", drawn_card_object.show_card())
        other_player_state.cards.append(drawn_card_object)
    elif number == '13':  # DRAW_FOUR was played by the player
        print("DRAW_FOUR was played by the player")
        if len(bot_game_state.deck.cards) < 4:
            print("DECK EXHAUSTED!!!")
            recover_deck(other_player_state, bot_game_state, player_state)
        # Drawing First Card
        drawn_card_object = bot_game_state.deck.deal()
        print("Card Drawn from the Deck is", drawn_card_object.show_card())
        other_player_state.cards.append(drawn_card_object)
        # Drawing Second Card
        drawn_card_object = bot_game_state.deck.deal()
        print("Card Drawn from the Deck is", drawn_card_object.show_card())
        other_player_state.cards.append(drawn_card_object)
        # Drawing Third Card
        drawn_card_object = bot_game_state.deck.deal()
        print("Card Drawn from the Deck is", drawn_card_object.show_card())
        other_player_state.cards.append(drawn_card_object)
        # Drawing Forth Card
        drawn_card_object = bot_game_state.deck.deal()
        print("Card Drawn from the Deck is", drawn_card_object.show_card())
        other_player_state.cards.append(drawn_card_object)


def update_bot_game_state_only(color_changed_to, type_changed_to, bot_game_state):
    '''
    This function is used to update the bot_game_state as per the card played by the player.
    It is called only when the category of card played is "W"
    '''
    valid_color = False
    for color in ['R', 'G', 'B', 'Y']:
        if color == color_changed_to:
            valid_color = True
            bot_game_state.top_card.category = color_changed_to
            bot_game_state.top_card_type = type_changed_to
            print(f"get_top_card will now return:", bot_game_state.get_top_card())
            break
    if not valid_color:
        print("Player is a Cheater!!!")


def compare(item):
    return int(item.split(" of ")[0])


def max_freq_color(bot_state):
    cnt_r = 0
    cnt_g = 0
    cnt_b = 0
    cnt_y = 0
    for card in bot_state.cards:
        if card.category == 'R':
            cnt_r += 1
        elif card.category == 'G':
            cnt_g += 1
        elif card.category == 'B':
            cnt_b += 1
        elif card.category == 'Y':
            cnt_y += 1

    comp_1 = cnt_r if cnt_r > cnt_g else cnt_g
    comp_2 = cnt_b if cnt_b > cnt_y else cnt_y
    cmp = comp_1 if comp_1 > comp_2 else comp_2
    color = None
    if cmp == cnt_r:
        color = 'R'
    elif cmp == cnt_g:
        color = 'G'
    elif cmp == cnt_b:
        color = 'B'
    else:
        color = 'Y'
    return color


def max_freq_color_in_allowed_cards(bot_state):
    cnt_r = 0
    cnt_g = 0
    cnt_b = 0
    cnt_y = 0
    for card_val in bot_state.allowed_cards:
        number, category = card_val.split(" of ")
        if category == 'R':
            cnt_r += 1
        elif category == 'G':
            cnt_g += 1
        elif category == 'B':
            cnt_b += 1
        elif category == 'Y':
            cnt_y += 1

    comp_1 = cnt_r if cnt_r > cnt_g else cnt_g
    comp_2 = cnt_b if cnt_b > cnt_y else cnt_y
    cmp = comp_1 if comp_1 > comp_2 else comp_2
    color = None
    if cmp == cnt_r:
        color = 'R'
    elif cmp == cnt_g:
        color = 'G'
    elif cmp == cnt_b:
        color = 'B'
    else:
        color = 'Y'
    return color


def bot_decide_card(bot_state):
    """
    If there is any special Card => Play it
    Else Choose the most frequent color among allowed moves and most Frequent number among numbers of the color chosen

    :param bot_state:
    :return: string representing the card to play or DRAW_CARD,
    """
    # Easy Bot
    cards = bot_state.allowed_cards
    if len(cards):
        # print("Cnt of Allowed Cards:", len(cards))
        cards.sort(key=compare)
        for card_val in cards:
            # print("Allowed Card", card_val)
            number, category = card_val.split(" of ")
            if number in ['10', '11', '12', '13']:
                print("Special Card Played by the Bot.")
                return card_val
        color = max_freq_color_in_allowed_cards(bot_state)
        print("Most Frequent Color is", color)
        frq_of_numbers = {}
        max_freq = 0
        card_play_val = None
        for card_val in cards:
            number, category = card_val.split(" of ")
            if category == color:
                if frq_of_numbers.get(number, None) is not None:
                    frq_of_numbers[number] += 1
                else:
                    frq_of_numbers[number] = 1
                if frq_of_numbers[number] > max_freq:
                    max_frq = frq_of_numbers[number]
                    card_play_val = card_val
        print("Decided Card to play is", card_play_val)
        return card_play_val
    else:
        return "DRAW_CARD"


def bot_choose_top_color(bot_state):
    return max_freq_color(bot_state) # Value will be among R, G, B, Y


def color_changing_special_card_allowed(allowed_cards_list):
    for card_val in allowed_cards_list:
        if card_val == "13 of W" or card_val == "13 of WF":
            return 1
    return 0 


def decide_top_color_using_game_info(colors_to_choose_from, bot_game_state):
    cnt_draws_on_red = bot_game_state.player_draws_count_list[0]
    cnt_draws_on_green = bot_game_state.player_draws_count_list[1]
    cnt_draws_on_blue = bot_game_state.player_draws_count_list[2]
    cnt_draws_on_yellow = bot_game_state.player_draws_count_list[3]
    color_on_which_max_draws = None
    draws = 0;
    for color in colors_to_choose_from:
        if color == 'R':
            if draws < cnt_draws_on_red:
                draws = cnt_draws_on_red
                color_on_which_max_draws = 'R'
        elif color == 'G':
            if draws < cnt_draws_on_green:
                draws = cnt_draws_on_green
                color_on_which_max_draws = 'G'
        elif color == 'B':
            if draws < cnt_draws_on_blue:
                draws = cnt_draws_on_blue
                color_on_which_max_draws = 'B'
        elif color == 'Y':
            if draws < cnt_draws_on_yellow:
                draws = cnt_draws_on_yellow
                color_on_which_max_draws = 'Y'
    color_on_which_max_draws


def bot_play_card(bot_state, bot_game_state, player_state, top_color=None):

    for card in bot_state.cards:
        print(card.show_card())


    """
    :param bot_state: it will be updated as per the card played by the bot
    :param bot_game_state: bot_game_state.top_card value will be updated
    :param player_state: it will be passed in recover_deck if required.
    :param top_color: if earlier card played was a wild then this parameter will show the color of top card
    :return:
    """
    # EASY BOT
    bot_level = bot_game_state.bot_level
    if bot_level == 0:
        print("Easy Bot is Deciding")
        bot_state.allowed_cards = get_playable_cards(bot_state, bot_game_state, top_color)
        card_val_to_move = bot_decide_card(bot_state)
        if card_val_to_move == "DRAW_CARD":
            if not len(bot_game_state.deck.cards):
                print("DECK EXHAUSTED!!!")
                recover_deck(player_state, bot_game_state, bot_state)
            drawn_card_object = bot_game_state.deck.deal()
            print("Card Drawn from the Deck is", drawn_card_object.show_card())
            bot_state.cards.append(drawn_card_object)
            return card_val_to_move
        else:
            try:
                bot_state.allowed_cards.remove(card_val_to_move)
                for card in bot_state.cards:
                    if card.show_card() == card_val_to_move:
                        bot_state.cards.remove(card)
                        bot_game_state.top_card = card
                        number, category = card_val_to_move.split(" of ")
                        if number == '13':
                            if category == 'W':
                                bot_game_state.top_card_type = 0 # W 
                            else:
                                bot_game_state.top_card_type = 1 # WF
                        break
            except:
                print("Illegal move!!! How not Present in Allowed Cards?")
        return card_val_to_move
    # MEDIUM BOT
    else: 
        print("Medium Bot is Deciding")
        DECIDED_YET = False
        card_val_to_move = None
        bot_state.allowed_cards = get_playable_cards(bot_state, bot_game_state, top_color)
        # Step 1: Check if Count of Opponents Cards is <= 2
        player_cards_count = len(player_state.cards)
        allowed_cards_list = bot_state.allowed_cards
        if player_cards_count <= 2:
            print("Player Count of Cards <= 2")
            # Consider Playing the Special Cards
            # Check if there exist a WF
            if DECIDED_YET == False:
                for card_val in allowed_cards_list:
                    if card_val == "13 of WF":
                        print("Player will play WF")
                        card_val_to_move = card_val
                        DECIDED_YET = True
                        break
            # Check if there exist a DT
            if DECIDED_YET == False:
                for card_val in allowed_cards_list:
                    number, category = card_val.split(" of ")
                    if number == '12':
                        print("Player will play DT")
                        card_val_to_move = card_val
                        DECIDED_YET = True
                        break
            # Check if there exist a Reverse/Skip
            if DECIDED_YET == False:
                for card_val in allowed_cards_list:
                    number, category = card_val.split(" of ")
                    if number == '11' or number == '10':
                        print("Player will play REV/SKIP")
                        card_val_to_move = card_val
                        DECIDED_YET = True
                        break
            # Check if there exist a Wild Card
            if DECIDED_YET == False:
                for card_val in allowed_cards_list:
                    if card_val == "13 of W":
                        print("Player will play Wild")
                        card_val_to_move = card_val
                        DECIDED_YET = True
                        break
            # Just decide to Play the Card with most Frequent Color
            if DECIDED_YET == False:
                print("Player will Just decide to Play the Card with most Frequent Color Cant do anything else")
                card_val_to_move = bot_decide_card(bot_state)
                DECIDED_YET = True

            print("Taking action on decided card", card_val_to_move)
            if card_val_to_move == "DRAW_CARD":
                if not len(bot_game_state.deck.cards):
                    print("DECK EXHAUSTED!!!")
                    recover_deck(player_state, bot_game_state, bot_state)
                drawn_card_object = bot_game_state.deck.deal()
                print("Card Drawn from the Deck is", drawn_card_object.show_card())
                bot_state.cards.append(drawn_card_object)
                return card_val_to_move
            else:
                try:
                    bot_state.allowed_cards.remove(card_val_to_move)
                    for card in bot_state.cards:
                        if card.show_card() == card_val_to_move:
                            bot_state.cards.remove(card)
                            bot_game_state.top_card = card
                            number, category = card_val_to_move.split(" of ")
                            if number == '13':
                                if category == 'W':
                                    bot_game_state.top_card_type = 0 # W 
                                else:
                                    bot_game_state.top_card_type = 1 # WF
                            break
                except:
                    print("Illegal move!!! How not Present in Allowed Cards?")
            return card_val_to_move
        # Step 2: When Cards Count is > 2
        else:
            # Check if Top Card is a Number Card i.e. between 0 to 9
            top_card_val = bot_game_state.top_card.show_card()
            print("Using top Card", top_card_val)
            top_number, top_category = top_card_val.split(" of ")
            if top_number in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']:
                print("Top Card is not Color Specific i.e. Special Card")
                # Top Card is not Color Specific/Special Card
                # Bot can choose same number of Different Colors
                colors_to_choose_from = []
                for card_val in allowed_cards_list:
                    number, category = card_val.split(" of ")
                    if number == top_number:
                        colors_to_choose_from.append(category);

                if len(colors_to_choose_from) == 0:
                    print("We cannot have the Same Number as the top_number")
                    # We cannot have the Same Number as the top_number
                    # Choose any of the Card belonging to top_category
                    for card_val in allowed_cards_list:
                        number, category = card_val.split(" of ")
                        if number in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] and category == top_category:
                            card_val_to_move = card_val
                            DECIDED_YET = True
                            break
                    if DECIDED_YET == False:
                        print("We cannot have the Same Color as the top_number as well")
                        card_val_to_move = bot_decide_card(bot_state)
                        DECIDED_YET = True
                elif len(colors_to_choose_from) == 1:
                    print("We can have the Same Number as the top_number but no other color options. So just Play it")
                    # We can have the Same Number as the top_number but no other color options. So just Play it
                    card_val_to_move = f"{top_number} of {colors_to_choose_from[0]}"
                    DECIDED_YET = True
                else:
                    print("We can have the Same Number as the top_number and need to decide the Color of the Top Card")
                    # We can have the Same Number as the top_number and need to decide the Color of the Top Card
                    if color_changing_special_card_allowed(allowed_cards_list):
                        # if we have a Color Changing Special Card, then play according to the opponents draws count
                        color = decide_top_color_using_game_info(colors_to_choose_from, bot_game_state)
                        card_val_to_move = f"{top_number} of {color}"
                        print("Handle the Case for usign game info here...")
                    else:
                        print("else play according to what most frequent color we have out of colors_to_choose_from ")
                        # else play according to what most frequent color we have out of colors_to_choose_from 
                        frq = {}
                        frq['R'] = 0
                        frq['G'] = 0
                        frq['B'] = 0 
                        frq['Y'] = 0 
                        for card_val in allowed_cards_list:
                            number, category = card_val.split(" of ")
                            if category == 'R':
                                frq['R'] += 1
                            elif category == 'G':
                                frq['G'] += 1
                            elif category == 'B': 
                                frq['B'] += 1
                            elif category == 'Y':
                                frq['Y'] += 1
                        max_freq_color = None
                        max_freq = 0
                        for color in colors_to_choose_from:
                            if frq[color] > max_freq:
                                max_freq_color = color
                        card_val_to_move = f"{top_number} of {max_freq_color}"
                        DECIDED_YET = True
            else:
                print("Top Card is Color Specific i.e. Special Card")
                # Top Card is Color Specific i.e. Special Card
                # Choose any of the Card belonging to top_category
                for card_val in allowed_cards_list:
                    number, category = card_val.split(" of ")
                    if number in ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'] and category == top_category:
                        card_val_to_move = card_val
                        DECIDED_YET = True
                        break

                if DECIDED_YET == False:
                # Don't have any Number Card of this color, hence need to move Special Card or Draw Card
                    card_val_to_move = bot_decide_card(bot_state)
                    DECIDED_YET = True

            print("Taking action on decided card", card_val_to_move)
            if card_val_to_move == "DRAW_CARD":
                if not len(bot_game_state.deck.cards):
                    print("DECK EXHAUSTED!!!")
                    recover_deck(player_state, bot_game_state, bot_state)
                drawn_card_object = bot_game_state.deck.deal()
                print("Card Drawn from the Deck is", drawn_card_object.show_card())
                bot_state.cards.append(drawn_card_object)
                return card_val_to_move
            else:
                try:
                    bot_state.allowed_cards.remove(card_val_to_move)
                    for card in bot_state.cards:
                        if card.show_card() == card_val_to_move:
                            bot_state.cards.remove(card)
                            bot_game_state.top_card = card
                            number, category = card_val_to_move.split(" of ")
                            if number == '13':
                                if category == 'W':
                                    bot_game_state.top_card_type = 0 # W 
                                else:
                                    bot_game_state.top_card_type = 1 # WF
                            break
                except:
                    print("Illegal move!!! How not Present in Allowed Cards?")
            return card_val_to_move

class BotGameServer:
    """
    Properties/State: 
        1. bot_state 
        2. player_state 
        3. bot_game_state
    """
    current_games = {} # Dictionary Storing all the Games Currently Being Played on the Server

    def __init__(self, bot_id, player, bot_game_room, bot_level, player_draws_count_list):
        self.bot_state = PlayerState(bot_id, [])
        self.player_state = PlayerState(player, [])
        self.bot_game_state = BotGameState(bot_game_room, bot_id, player, bot_level, player_draws_count_list)
        self.deal_hands()

    @classmethod
    def create_bot_game(cls, bot_id, player, bot_game_room, bot_level):
        player_draws_count_list = [0, 0, 0, 0]
        if cls.current_games.get(bot_game_room) is None:
            cls.current_games[bot_game_room] = cls(bot_id, player, bot_game_room, bot_level, player_draws_count_list) # calling the constructor
        else:
            cls.current_games[bot_game_room].bot_game_state.bot_level = bot_level
        print("Bot_LEVEL_IS", cls.current_games[bot_game_room].bot_game_state.bot_level)
        return cls.current_games[bot_game_room]

    @classmethod
    def delete_bot_game(cls, bot_game_room):
        if cls.current_games.get(bot_game_room) is not None:
            del cls.current_games[bot_game_room]

    def deal_hands(self, cards_per_player=7):
        """
        Method to deal hands to bot and the player from the deck of this Game.
        :param cards_per_player:
        :return:
        """
        for i in range(int(cards_per_player)):
            self.bot_state.cards.append(self.bot_game_state.deck.deal())
        for i in range(int(cards_per_player)):
            self.player_state.cards.append(self.bot_game_state.deck.deal())


class BotGameConsumer(AsyncConsumer):
    
    player = None # username of the user playing with bot
    bot_game_room = None # Name of the room stored in DB
    bot = None # id of the bot
    # Above 3 properties are set when web_socket connection opens.
    game = None # Object of BotGameServer class. This is set when player presses the Play Now Button
    bot_level = None # number showing the level of the bot
    async def websocket_connect(self, event):
        print("Accepting an handshake request", event)

        player = self.scope['user']
        self.player = player
        bot_instance = await self.get_bot_for_username(player)
        self.bot = bot_instance
        self.bot_id = None
        if bot_instance is None:
            print("Error: There was some Problem creating a bot")
            return
        else:
            self.bot_id = bot_instance.id

        bot_game_room = f"bot_{self.bot_id}_{player}"  # This is a name given to our Bot-Game-Room
        # Giving a unique name to the current room as per player username and bot_id
        self.bot_game_room = bot_game_room
        # print(bot_game_room)
        # print(self.channel_name)

        # Creating the Game room
        await self.channel_layer.group_add(
            self.bot_game_room,  # Name of the Bot-Game-Room
            self.channel_name  # Name of the Channel
        )

        # accepting the Handshake or Upgrade from HTTP to WebSocket
        await self.send({
            "type": "websocket.accept",
        })


    async def websocket_receive(self, event):
        """
        Note 1:
            With every server_response, in addition to other response values, server must send:
                Current Version:
                    1. response_player_state
                    2. response_bot_state
                    3. response_bot_game_state
                    4. response_playable_cards
                    5. response_bot_played_cards
                For Final Version:
                    1. response_player_state
                    2. response_bot_game_state
                    3. response_playable_cards
                    4. response_bot_played_cards        
            Optional Possible Values are: 
                1. response_drawn_card_val
                2. response_top_color
                3. response_bot_says_uno
                4. response_bot_won
        Note 2:
            "response_" prefix signifies that this value we will send as server response, if it is not some constant value.
        """
        # Message received after Clicking Play Button
        front_text = event.get('text', None)
        if front_text:
            print("Front Text Exists!")
            loaded_dict_data = json.loads(front_text)
            type_of_event = loaded_dict_data.get('type', None)
            text_of_event = loaded_dict_data.get('text', None)
            # print(type_of_event, type())
            if type_of_event and text_of_event:
                if type_of_event == "change.scene":
                    self.bot_level = text_of_event.get('data').get('bot_level')
                    # This is surely a Change Scene Request which came after pressing Play Button.
                    change_scene_response = {
                        "status": "change_scene",
                        "message": "Scene Changed",
                        "data": {
                            "sceneNumber": 2,
                        }
                    }
                    await self.channel_layer.group_send(
                        self.bot_game_room,
                        {
                            "type": "change.scene",
                            "text": json.dumps(change_scene_response)
                        }
                    )
                    return
                elif type_of_event == "start.game":
                    print("Start Game Received.")
                    # This is a start game request.
                    # if any state of this game room was present earlier, then retrieve that state
                    self.game = BotGameServer.create_bot_game(bot_id=self.bot_id, player=self.player,
                                                              bot_game_room=self.bot_game_room, bot_level=self.bot_level)
                    response_player_state = self.game.player_state.get_all_cards()
                    response_bot_state = self.game.bot_state.get_all_cards()
                    response_bot_game_state = self.game.bot_game_state.get_top_card()
                    response_playable_cards = get_playable_cards(self.game.player_state, self.game.bot_game_state)
                    response_bot_played_cards = []
                    response_bot_says_uno = 0
                    if len(response_bot_state) == 1:
                        response_bot_says_uno = 1
                    server_response = {
                        "player_state": json.dumps(response_player_state),  # list of Cards (in string format)
                        "bot_state": json.dumps(response_bot_state),  # list of Cards (in string format)
                        "bot_game_state": json.dumps(response_bot_game_state),  # Top Card (in string format)
                        "playable_cards": response_playable_cards,  # list of Cards (in string format)
                        "bot_played_cards": [], # list of Cards (in string format)
                        "bot_says_uno": response_bot_says_uno # a number
                    }

                    await self.channel_layer.group_send(
                        self.bot_game_room,  # name of the Bot room
                        {
                            'type': "send_to_player",
                            'text': json.dumps(server_response)
                        }
                    )
                    print("Start Game Sent.")
                    return

        # When a message is received from the Websocket
        data_received_dict = json.loads(event.get('text', None))
        card_played_value = data_received_dict.get('card_played_value', None)
        color_changed_to = data_received_dict.get('color_changed_to', None)
        play_keep_decision = data_received_dict.get('play_keep_decision', None)
        bot_turn = False
        if play_keep_decision is not None:
            if play_keep_decision == 1: # Play
                print("Player Decided to Play the earlier Drawn Card")
                card_played_value = data_received_dict.get('drawn_card_val', None) # As if Player has played this card.
                # Now player will Play this Card
            else: # Keep
                print("Player Decided to Keep the earlier Drawn Card")
                bot_turn = True
                pass
                # When card_played_value was DRAW_CARD just now then we have already appended the card in the Players Deck
                # So, nothing is required to be done for player_state and bot_game_state 
                # Now BOT will Play
        if bot_turn is False:
            if card_played_value == 'DRAW_CARD':
                print("Player asked to play DRAW_CARD")
                drawn_card = update_state_request("DRAW_CARD", self.game.player_state, self.game.bot_game_state, self.game.bot_state)
                if drawn_card is not None: # Drawn Card Was Playable
                    # Generating the server_response
                    response_player_state = self.game.player_state.get_all_cards()
                    response_bot_state = self.game.bot_state.get_all_cards()
                    response_bot_game_state = self.game.bot_game_state.get_top_card()
                    response_playable_cards = get_playable_cards(self.game.player_state, self.game.bot_game_state)
                    response_bot_played_cards = []
                    response_drawn_card_val = drawn_card.show_card()
                    server_response = {
                        "player_state": json.dumps(response_player_state),
                        "bot_state": json.dumps(response_bot_state),
                        "bot_game_state": json.dumps(response_bot_game_state),
                        "playable_cards": response_playable_cards,
                        "bot_played_cards": response_bot_played_cards,
                        "drawn_card_val": response_drawn_card_val,
                        "choose_to_play_or_keep": True
                    }
                    await self.channel_layer.group_send(
                        self.bot_game_room,  # name of the Bot Game Room
                        {
                            'type': "send_to_player",
                            'text': json.dumps(server_response)
                        }
                    )
                    return
                else: 
                    # Drawn Card Was Not Playable
                    # Now Bot will Play its Turn
                    pass
            elif card_played_value == 'END_GAME':
                print("Player asked to End the Game")
                BotGameServer.delete_bot_game(self.game.bot_game_state.bot_game_room)
                # Game Ended
                return
            else:
                # Updating the State of player and bot_game
                print("Player asked to play", card_played_value)
                update_state_request(card_played_value, self.game.player_state, self.game.bot_game_state, self.game.bot_state)
                response_player_state = self.game.player_state.get_all_cards()
                if len(response_player_state) == 0:
                    # Generating the server_response
                    response_bot_state = self.game.bot_state.get_all_cards()
                    response_bot_game_state = self.game.bot_game_state.get_top_card()
                    response_playable_cards = get_playable_cards(self.game.player_state, self.game.bot_game_state)
                    response_bot_played_cards = []
                    server_response = {
                        "player_state": json.dumps(response_player_state),
                        "bot_state": json.dumps(response_bot_state),
                        "bot_game_state": json.dumps(response_bot_game_state),
                        "playable_cards": response_playable_cards,
                        "bot_played_cards": [],
                        "player_won": 1
                    }
                    await self.channel_layer.group_send(
                        self.bot_game_room,  # name of the Chat root
                        {
                            'type': "send_to_player",
                            'text': json.dumps(server_response)
                        }
                    )
                    return
                number, category = card_played_value.split(" of ")
                if number == '10' or number == '11':  # Skip or Reverse => Bot is not allowed to play
                    print("Player Played Skip")
                    # Generating the server_response
                    response_bot_state = self.game.bot_state.get_all_cards()
                    response_bot_game_state = self.game.bot_game_state.get_top_card()
                    response_playable_cards = get_playable_cards(self.game.player_state, self.game.bot_game_state)
                    response_bot_played_cards = []
                    server_response = {
                        "player_state": json.dumps(response_player_state),
                        "bot_state": json.dumps(response_bot_state),
                        "bot_game_state": json.dumps(response_bot_game_state),
                        "playable_cards": response_playable_cards,
                        "bot_played_cards": [],
                    }

                    await self.channel_layer.group_send(
                        self.bot_game_room,  # name of the Chat root
                        {
                            'type': "send_to_player",
                            'text': json.dumps(server_response)
                        }
                    )
                    # Bot Turn Skipped
                    return
                elif number == '13' and category == 'W':
                    print("Player Played Wild Card")
                    print("Player asked to Change the Color to", color_changed_to)
                    # Updating the Game State i.e. setting the Top Card Color
                    update_bot_game_state_only(color_changed_to=color_changed_to, type_changed_to=0, bot_game_state=self.game.bot_game_state)
                    # Now Bot will Play its Turn
                elif number == '12' or number == '13':
                    # DRAW_TWO/DRAW_FOUR => Bot have to draw 2/4 Cards and Player will play again
                    print("Player Played DRAW_TWO/DRAW_FOUR")
                    # Bot will need to Draw the Cards
                    update_other_player_state_only(number, self.game.bot_state, self.game.bot_game_state,
                                                   self.game.player_state)
                    if number == '13': # This is a DRAW_FOUR so, changing the color
                        # Updating the Game State i.e. setting the Top Card Color
                        update_bot_game_state_only(color_changed_to=color_changed_to, type_changed_to=1, bot_game_state=self.game.bot_game_state)

                    # Generating the server_response
                    response_player_state = self.game.player_state.get_all_cards()
                    response_bot_state = self.game.bot_state.get_all_cards()
                    response_bot_game_state = self.game.bot_game_state.get_top_card()
                    response_playable_cards = get_playable_cards(self.game.player_state, self.game.bot_game_state)
                    response_bot_played_cards = []
                    server_response = {
                        "player_state": json.dumps(response_player_state),
                        "bot_state": json.dumps(response_bot_state),
                        "bot_game_state": json.dumps(response_bot_game_state),
                        "playable_cards": response_playable_cards,
                        "bot_played_cards": response_bot_played_cards
                    }

                    await self.channel_layer.group_send(
                        self.bot_game_room,  # name of the Chat root
                        {
                            'type': "send_to_player",
                            'text': json.dumps(server_response)
                        }
                    )
                    # Bot Turn Skipped
                    return
        else:
            # It is Bot's Turn So, Bot will Play
            pass

        # Now Bot will Play:-
        bot_played_cards = []
        response_top_color = None
        response_bot_won = 0
        while True and response_bot_won == 0:
            played_card = bot_play_card(self.game.bot_state, self.game.bot_game_state, self.game.player_state, response_top_color)
            bot_played_cards.append(played_card)
            if played_card == "DRAW_CARD":  # DRAW_CARD played by bot
                print("Draw Card Played By Bot")
                break
            elif played_card == "13 of W":
                print("Wild Card Played By Bot")  # Wild played by bot
                response_top_color = bot_choose_top_color(self.game.bot_state)
                print("Bot Chose Color:", response_top_color)
                update_bot_game_state_only(color_changed_to=response_top_color, type_changed_to=0, bot_game_state=self.game.bot_game_state)
                break
            elif played_card == "13 of WF":
                number, category = played_card.split(" of ")
                print("Draw Four Card Played By Bot")  # Draw Four played by bot
                update_other_player_state_only(number, self.game.player_state, self.game.bot_game_state,
                                               self.game.bot_state)
                response_top_color = bot_choose_top_color(self.game.bot_state)
                print("Bot Chose Color:", response_top_color)
                update_bot_game_state_only(color_changed_to=response_top_color, type_changed_to=1, bot_game_state=self.game.bot_game_state)
                if len(self.game.bot_state.get_all_cards()) == 0:
                    response_bot_won = 1
                continue
            else:
                number, category = played_card.split(" of ")
                if number == '12':  # Draw Two played by bot
                    print("Draw Two was Played By Bot")
                    update_other_player_state_only(number, self.game.player_state, self.game.bot_game_state,
                                                   self.game.bot_state)
                    
                    # Bot will Play Again
                    if len(self.game.bot_state.get_all_cards()) == 0:
                        response_bot_won = 1
                    continue
                elif number == '10' or number == '11':  # Skip or Reverse
                    # Bot will Play Again
                    if len(self.game.bot_state.get_all_cards()) == 0:
                        response_bot_won = 1
                    continue
                else:
                    break

        # Generating the server_response
        response_player_state = self.game.player_state.get_all_cards()
        response_bot_state = self.game.bot_state.get_all_cards()
        response_bot_game_state = self.game.bot_game_state.get_top_card()
        response_playable_cards = get_playable_cards(self.game.player_state, self.game.bot_game_state, response_top_color)
        response_bot_played_cards = bot_played_cards
        response_bot_says_uno = 0
        if len(response_bot_state) == 1:
            response_bot_says_uno = 1
        elif len(response_bot_state) == 0:
            response_bot_won = 1
        server_response = {
            "player_state": json.dumps(response_player_state),
            "bot_state": json.dumps(response_bot_state),
            "bot_game_state": json.dumps(response_bot_game_state),
            "playable_cards": response_playable_cards,
            "bot_played_cards": response_bot_played_cards,
            "top_color": response_top_color,
            "bot_says_uno": response_bot_says_uno,
            "bot_won": response_bot_won
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

    async def change_scene(self, event):
        await self.send({
            "type": "websocket.send",
            "text": event['text']
        })

    async def websocket_disconnect(self, event):
        print("[PRINTED]:- Websocket Connection has been Disconnected", event)
        # if self.game is not None:
        #     del BotGameServer.current_games[self.bot_game_room]

    @database_sync_to_async
    def get_bot_for_username(self, player):
        return Bot.objects.get_bot_for_username(player)
