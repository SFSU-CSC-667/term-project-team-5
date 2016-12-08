CREATE TABLE public.players
(
  player_id integer NOT NULL,
  first_name text NOT NULL,
  last_name text,
  e_mail text NOT NULL,
  username text NOT NULL,
  passwrd text NOT NULL,
  CONSTRAINT players_pkey PRIMARY KEY (player_id),
  CONSTRAINT players_username_key UNIQUE (username)
);

CREATE TABLE public.scoreboard
(
  player_id integer NOT NULL,
  games_won integer,
  games_lost integer,
  total_games integer,
  last_game_date date,
  CONSTRAINT scoreboard_pkey PRIMARY KEY (player_id),
  CONSTRAINT scoreboard_player_id_fkey FOREIGN KEY (player_id)
      REFERENCES public.players (player_id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE public.cards
(
  card_id integer NOT NULL,
  rank integer NOT NULL,
  suit character(1) NOT NULL,
  CONSTRAINT cards_pkey PRIMARY KEY (card_id)
);


CREATE TABLE public.games
(
  game_id integer NOT NULL,
  game_date date NOT NULL,
  card_id_discarded integer NOT NULL,
  CONSTRAINT games_pkey PRIMARY KEY (game_id),
  CONSTRAINT games_card_id_discarded_fkey FOREIGN KEY (card_id_discarded)
      REFERENCES public.cards (card_id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE public.gameplayers
(
  game_id integer NOT NULL,
  player_id integer NOT NULL,
  CONSTRAINT gameplayers_game_id_fkey FOREIGN KEY (game_id)
      REFERENCES public.games (game_id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT gameplayers_player_id_fkey FOREIGN KEY (player_id)
      REFERENCES public.players (player_id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE public.gameplayercards
(
  game_id integer NOT NULL,
  card_id integer NOT NULL,
  player_id integer NOT NULL,
  is_melded boolean NOT NULL,
  CONSTRAINT gameplayercards_card_id_fkey FOREIGN KEY (card_id)
      REFERENCES public.cards (card_id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT gameplayercards_game_id_fkey FOREIGN KEY (game_id)
      REFERENCES public.games (game_id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT gameplayercards_player_id_fkey FOREIGN KEY (player_id)
      REFERENCES public.players (player_id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION
);



INSERT INTO cards(card_id, rank, suit) VALUES ( 1,1,'H');
INSERT INTO cards(card_id, rank, suit) VALUES ( 2,2,'H');
INSERT INTO cards(card_id, rank, suit) VALUES ( 3,3,'H');
INSERT INTO cards(card_id, rank, suit) VALUES ( 4,4,'H');
INSERT INTO cards(card_id, rank, suit) VALUES ( 5,5,'H');
INSERT INTO cards(card_id, rank, suit) VALUES ( 6,6,'H');
INSERT INTO cards(card_id, rank, suit) VALUES ( 7,7,'H');
INSERT INTO cards(card_id, rank, suit) VALUES ( 8,8,'H');
INSERT INTO cards(card_id, rank, suit) VALUES ( 9,9,'H');
INSERT INTO cards(card_id, rank, suit) VALUES ( 10,10,'H');
INSERT INTO cards(card_id, rank, suit) VALUES ( 11,11,'H');
INSERT INTO cards(card_id, rank, suit) VALUES ( 12,12,'H');
INSERT INTO cards(card_id, rank, suit) VALUES ( 13,13,'H');
INSERT INTO cards(card_id, rank, suit) VALUES ( 14,1,'S');
INSERT INTO cards(card_id, rank, suit) VALUES ( 15,2,'S');
INSERT INTO cards(card_id, rank, suit) VALUES ( 16,3,'S');
INSERT INTO cards(card_id, rank, suit) VALUES ( 17,4,'S');
INSERT INTO cards(card_id, rank, suit) VALUES ( 18,5,'S');
INSERT INTO cards(card_id, rank, suit) VALUES ( 19,6,'S');
INSERT INTO cards(card_id, rank, suit) VALUES ( 20,7,'S');
INSERT INTO cards(card_id, rank, suit) VALUES ( 21,8,'S');
INSERT INTO cards(card_id, rank, suit) VALUES ( 22,9,'S');
INSERT INTO cards(card_id, rank, suit) VALUES ( 23,10,'S');
INSERT INTO cards(card_id, rank, suit) VALUES ( 24,11,'S');
INSERT INTO cards(card_id, rank, suit) VALUES ( 25,12,'S');
INSERT INTO cards(card_id, rank, suit) VALUES ( 26,13,'S');
INSERT INTO cards(card_id, rank, suit) VALUES ( 27,1,'C');
INSERT INTO cards(card_id, rank, suit) VALUES ( 28,2,'C');
INSERT INTO cards(card_id, rank, suit) VALUES ( 29,3,'C');
INSERT INTO cards(card_id, rank, suit) VALUES ( 30,4,'C');
INSERT INTO cards(card_id, rank, suit) VALUES ( 31,5,'C');
INSERT INTO cards(card_id, rank, suit) VALUES ( 32,6,'C');
INSERT INTO cards(card_id, rank, suit) VALUES ( 33,7,'C');
INSERT INTO cards(card_id, rank, suit) VALUES ( 34,8,'C');
INSERT INTO cards(card_id, rank, suit) VALUES ( 35,9,'C');
INSERT INTO cards(card_id, rank, suit) VALUES ( 36,10,'C');
INSERT INTO cards(card_id, rank, suit) VALUES ( 37,11,'C');
INSERT INTO cards(card_id, rank, suit) VALUES ( 38,12,'C');
INSERT INTO cards(card_id, rank, suit) VALUES ( 39,13,'C');
INSERT INTO cards(card_id, rank, suit) VALUES ( 40,1,'D');
INSERT INTO cards(card_id, rank, suit) VALUES ( 41,2,'D');
INSERT INTO cards(card_id, rank, suit) VALUES ( 42,3,'D');
INSERT INTO cards(card_id, rank, suit) VALUES ( 43,4,'D');
INSERT INTO cards(card_id, rank, suit) VALUES ( 44,5,'D');
INSERT INTO cards(card_id, rank, suit) VALUES ( 45,6,'D');
INSERT INTO cards(card_id, rank, suit) VALUES ( 46,7,'D');
INSERT INTO cards(card_id, rank, suit) VALUES ( 47,8,'D');
INSERT INTO cards(card_id, rank, suit) VALUES ( 48,9,'D');
INSERT INTO cards(card_id, rank, suit) VALUES ( 49,10,'D');
INSERT INTO cards(card_id, rank, suit) VALUES ( 50,11,'D');
INSERT INTO cards(card_id, rank, suit) VALUES ( 51,12,'D');
INSERT INTO cards(card_id, rank, suit) VALUES ( 52,13,'D');
