-- ============================================================
-- H4CKR — Script SQL complet : 15 niveaux + indices
-- À exécuter dans : docker exec -it h4ckr_postgres psql -U h4ckr -d h4ckr_db
-- ============================================================

-- Nettoyage
DELETE FROM hints;
DELETE FROM levels;

-- ============================================================
-- NIVEAUX
-- ============================================================

INSERT INTO levels (chapter, position, type, title, description, artifact_url, solution_hash, points) VALUES

-- CHAPITRE 1 : Encodage classique
(1, 1, 'base64', 'Access Log',
 'Un message intercepté a été encodé en Base64. Décode-le pour trouver le code d''accès : QUNDRVNTX0dSQU5URUQ=',
 NULL,
 'af24787e8c9ff745cf7f840456571b782cd86aeb304cdaef49f56be693906ecd', 100),

(1, 2, 'cesar', 'Neon Message',
 'Un message chiffré par César a été capturé : QHRQ VBKDGRZ. Le décalage utilisé est de 3.',
 NULL,
 '780e32bb4494ca7a7c408269f8ab7a17c845cf2925769fe0a9e718b3b2394720', 120),

(1, 3, 'rot13', 'Terminal Echo',
 'Le terminal a retourné ce message crypté : QNEXARG. Décode-le.',
 NULL,
 '05612a4f843fafa5fc572f38f3fe5d7b0ef74fc921b19d01cc2f1fd57f082c24', 130),

(1, 4, 'hex', 'Hex Dump',
 'Un dump mémoire contient ces octets hexadécimaux : 53 59 53 54 45 4D. Convertis-les en texte ASCII. (sans espaces)',
 NULL,
 'bbc5e661e106c6dcd8dc6dd186454c2fcba3c710fb4d8e71a60c93eaf077f073', 140),

-- CHAPITRE 2 : Regex et JSON
(2, 1, 'regex', 'Regex Pattern',
 'Construis une expression régulière qui valide exactement : 3 lettres majuscules suivies de 2 chiffres. Exemple valide : ABC12. Exemple invalide : abc12, AB1, ABCD123.',
 NULL,
 '45b40f9fe8e6f31b284187cc0ba85380b6dcabf69ea921e358db7660a58073ae', 150),

(2, 2, 'json', 'Broken Config',
 'Ce fichier de configuration est corrompu. Trouve la valeur associée à la clé "access" : { "access":"omega_protocol", }',
 NULL,
 '06a76d6ee26f61e9ba6fa9d3a5d42d987e45f77f1b77508f0e89f47780613312', 160),

(2, 3, 'json', 'Hidden Nodes',
 'Navigue dans ce JSON imbriqué et trouve la valeur de "id" : { "nodes": { "sector": { "id":"node-77" } } }',
 NULL,
 '2c1abbd0b655891c84d979196d492cb963f463320044a282f6e917d12f05a058', 170),

-- CHAPITRE 3 : EXIF et HTTP
(3, 1, 'exif', 'Ghost Image',
 'Une image suspecte circule sur le réseau. Analyse ses métadonnées EXIF et trouve la valeur du champ "Author".',
 'https://raw.githubusercontent.com/ianare/exif-samples/master/jpg/Canon_40D.jpg',
 '07cf09d022f440eaed6bf262a46394822de3b93c7b325e04c472f63ae4225cbd', 200),

(3, 2, 'exif', 'City Coordinates',
 'Une photo géolocalisée a été capturée. Lis ses métadonnées GPS et trouve la latitude (format : XX.XXXXN).',
 'https://raw.githubusercontent.com/ianare/exif-samples/master/jpg/gps/DSCN0010.jpg',
 'f607f603f4c9bafa0a3d494f58d92f9a14a84bae6ebbf407298324bc9a0deeb3', 220),

(3, 3, 'http', 'Proxy Trace',
 'Une réponse HTTP a été interceptée. Elle contient un header custom commençant par X-. Trouve le nom du header (sans sa valeur) : X-H4CKR-ACCESS: TRUE',
 NULL,
 '4096cbb51c483a56a9ad62efe24eb060dabf216ebbaf7801468409d2bd1bac59', 200),

(3, 4, 'http', 'Redirect Maze',
 'Un endpoint effectue plusieurs redirections (301, 302, 307). Suis les redirections jusqu''au nœud final et retourne la valeur du dernier Location header.',
 NULL,
 'f08f7ab4eda5f63a86c422f7a19980fab099f2f740cb6f618dff3299c9c09bc9', 220),

-- CHAPITRE 4 : Avancé
(4, 1, 'regex', 'Vault Pattern',
 'Construis une regex qui valide un mot de passe fort : au moins 1 majuscule, au moins 1 chiffre, minimum 8 caractères. Utilise des lookaheads.',
 NULL,
 'fb8e132dd36911b6dd592fdfc5d608f2e504d4442fa14c20497e20054fab3f80', 250),

(4, 2, 'binaire', 'Binary Signal',
 'Un signal binaire a été intercepté. Convertis ces bits en texte ASCII puis trouve le nom du système : 01000011 01011001 01000010 01000101 01010010 01011111 01000011 01001111 01010010 01000101',
 NULL,
 'f053478939e080517626327664f7a13c89dfb1f66cdae1ec0f951dee9ae217ff', 280),

(4, 3, 'base64', 'Double Cipher',
 'Ce message a subi deux encodages successifs. Étape 1 : décoder le Base64 → T01FR0FfR0FURT0=. Étape 2 : le résultat est encore en Base64, décode-le une seconde fois.',
 NULL,
 'bb03e0ea0e166944feb20b1d3e0bb812ca43fbf67e407b205f3b6e76dc8dbb0c', 300),

(4, 4, 'json', 'Final Breach',
 'Analyse ce rapport d''intrusion multi-sources et combine les indices pour trouver le code maître. JSON: {"agent":"H4CKR","level":"MASTER"} — Concatène agent et level avec _ pour former le code final.',
 NULL,
 'f12177f186cba3e324d693e377f3733876d63deeea4b51168851bfc85511e491', 400);

-- ============================================================
-- INDICES
-- ============================================================

-- Niveau 1 : Base64
INSERT INTO hints (level_id, position, content, malus) VALUES
(1, 1, 'Base64 utilise uniquement les caractères A-Z, a-z, 0-9, + et /. Les = à la fin sont du padding.', 10),
(1, 2, 'En Python : import base64; base64.b64decode("QUNDRVNTX0dSQU5URUQ=").decode()', 20),
(1, 3, 'La réponse est en majuscules avec un underscore.', 30);

-- Niveau 2 : César
INSERT INTO hints (level_id, position, content, malus) VALUES
(2, 1, 'Le chiffre de César décale chaque lettre de l''alphabet d''un nombre fixe de positions.', 10),
(2, 2, 'Décalage de 3 signifie : D→A, E→B, F→C... Applique ça à chaque lettre.', 20),
(2, 3, 'La première lettre Q avec -3 donne N. Continue lettre par lettre.', 30);

-- Niveau 3 : ROT13
INSERT INTO hints (level_id, position, content, malus) VALUES
(3, 1, 'ROT13 remplace chaque lettre par celle qui est 13 positions plus loin dans l''alphabet.', 10),
(3, 2, 'ROT13 est son propre inverse : encoder = décoder. Q→D, N→A, E→R...', 20),
(3, 3, 'Le résultat est un mot lié au web clandestin, 7 lettres.', 30);

-- Niveau 4 : Hex
INSERT INTO hints (level_id, position, content, malus) VALUES
(4, 1, 'Chaque paire hexadécimale représente un caractère ASCII. 53 = 83 en décimal.', 10),
(4, 2, 'En Python : bytes.fromhex("535953544D45").decode() — retire les espaces d''abord.', 20),
(4, 3, 'Le résultat est un mot de 6 lettres lié à l''informatique.', 30);

-- Niveau 5 : Regex basique
INSERT INTO hints (level_id, position, content, malus) VALUES
(5, 1, '[A-Z] correspond à une lettre majuscule. {3} signifie exactement 3 fois.', 10),
(5, 2, '[0-9]{2} correspond à exactement 2 chiffres. ^ et $ ancrent le début et la fin.', 20),
(5, 3, 'La regex complète commence par ^ et finit par $, elle fait 15 caractères.', 30);

-- Niveau 6 : JSON cassé
INSERT INTO hints (level_id, position, content, malus) VALUES
(6, 1, 'Un JSON valide n''accepte pas de virgule après le dernier élément.', 10),
(6, 2, 'La virgule finale après "omega_protocol" est l''erreur. La valeur cherchée est la chaîne elle-même.', 20),
(6, 3, 'La réponse est exactement la valeur de la clé "access", en minuscules avec underscore.', 30);

-- Niveau 7 : JSON imbriqué
INSERT INTO hints (level_id, position, content, malus) VALUES
(7, 1, 'Pour accéder à une clé imbriquée en Python : data["nodes"]["sector"]["id"]', 10),
(7, 2, 'Il y a 3 niveaux d''imbrication avant d''atteindre "id".', 20),
(7, 3, 'La réponse contient un tiret et un nombre à 2 chiffres.', 30);

-- Niveau 8 : EXIF Author
INSERT INTO hints (level_id, position, content, malus) VALUES
(8, 1, 'Les métadonnées EXIF sont des informations cachées dans les fichiers image (auteur, date, GPS...).', 10),
(8, 2, 'Utilise exiftool, Jeffrey''s Exif Viewer ou le site exifdata.com pour lire les métadonnées.', 20),
(8, 3, 'Cherche spécifiquement le champ "Author" ou "Artist" dans les métadonnées.', 30);

-- Niveau 9 : EXIF GPS
INSERT INTO hints (level_id, position, content, malus) VALUES
(9, 1, 'Les coordonnées GPS sont stockées dans les champs "GPS Latitude" et "GPS Longitude" des métadonnées EXIF.', 10),
(9, 2, 'Le format attendu est : degrés décimaux suivis de N (Nord). Ex: 48.8566N', 20),
(9, 3, 'La latitude commence par 43 et comporte 6 chiffres après la virgule.', 30);

-- Niveau 10 : HTTP headers
INSERT INTO hints (level_id, position, content, malus) VALUES
(10, 1, 'Les headers HTTP custom commencent conventionnellement par X-. Ils transportent des métadonnées supplémentaires.', 10),
(10, 2, 'La réponse est uniquement le NOM du header, sans les deux-points ni la valeur.', 20),
(10, 3, 'Le header cherché contient le mot ACCESS et est en majuscules avec des tirets.', 30);

-- Niveau 11 : Redirections
INSERT INTO hints (level_id, position, content, malus) VALUES
(11, 1, 'Les codes 301, 302 et 307 sont des redirections HTTP. Chacun contient un header "Location" indiquant la destination.', 10),
(11, 2, 'Utilise curl -L pour suivre automatiquement les redirections, ou suis chaque Location manuellement.', 20),
(11, 3, 'Le nœud final contient un underscore et est en majuscules.', 30);

-- Niveau 12 : Regex avancée
INSERT INTO hints (level_id, position, content, malus) VALUES
(12, 1, 'Les lookaheads (?=...) vérifient une condition sans consommer de caractères. (?=.*[A-Z]) vérifie qu''il y a au moins une majuscule.', 10),
(12, 2, '(?=.*\d) vérifie la présence d''un chiffre. .{8,} impose un minimum de 8 caractères.', 20),
(12, 3, 'La regex commence par ^ suivi de deux lookaheads puis .{8,}$. Elle fait 27 caractères.', 30);

-- Niveau 13 : Binaire
INSERT INTO hints (level_id, position, content, malus) VALUES
(13, 1, 'Chaque groupe de 8 bits (octet) représente un caractère ASCII. Convertis d''abord en décimal.', 10),
(13, 2, 'En Python : chr(int("01000011", 2)) → C. Applique ça à chaque octet.', 20),
(13, 3, 'Le résultat est 10 caractères, contient un underscore, et est lié à la cybersécurité.', 30);

-- Niveau 14 : Double Base64
INSERT INTO hints (level_id, position, content, malus) VALUES
(14, 1, 'Le message a été encodé en Base64 deux fois. Tu dois décoder deux fois de suite.', 10),
(14, 2, 'Première décode : T01FR0FfR0FURT0= → un autre string Base64. Décode ce résultat une seconde fois.', 20),
(14, 3, 'Le résultat final contient un underscore et est lié au concept de porte d''accès.', 30);

-- Niveau 15 : Final
INSERT INTO hints (level_id, position, content, malus) VALUES
(15, 1, 'Lis attentivement le JSON : il contient deux clés. Concatène leurs valeurs avec un séparateur.', 10),
(15, 2, 'agent = "H4CKR", level = "MASTER". Le séparateur est un underscore _.', 20),
(15, 3, 'La réponse fait 12 caractères et contient un chiffre.', 30);
