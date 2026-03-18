# Bilan Cycle 3 — Chill2gether

## Objectifs du Cycle 3 et réalisations

### Objectifs fixés

| Objectif | Statut |
|---|---|
| Handler Socket.IO tableau blanc (`whiteboardHandlers.js`) | Réalisé |
| Handler Socket.IO partage d'écran — signaling WebRTC (`screenShareHandlers.js`) | Réalisé |
| Events Socket.IO pour les notes (`note:created`, `note:deleted`) | Réalisé |
| Intégration dans `socket.js` | Réalisé |
| Documentation finale (`README.md`) | Réalisé |
| Bilan de cycle (`BILAN.md`) | Réalisé |

### Ce qui a été réalisé

**Tableau blanc collaboratif**
- Store en mémoire par room (`whiteboardStore`) avec limite à 10 000 strokes
- Seul le créateur de la room (admin) peut dessiner ou effacer
- Diffusion des strokes en temps réel à tous les participants sauf l'émetteur
- Récupération de l'état complet pour les nouveaux arrivants

**Partage d'écran WebRTC**
- Serveur positionné uniquement comme relais de signaling (pas de traitement de flux)
- Relais de l'offre SDP, de la réponse et des candidats ICE entre pairs
- Nettoyage automatique au déconnect : si le partageur quitte, la room est notifiée
- Une seule session de partage d'écran par room à la fois

**Notes partagées**
- Deux events Socket.IO : `note:created` et `note:deleted`
- Relais simple vers les autres participants de la room (sans persistance BDD côté Socket — la persistance éventuelle est gérée côté frontend/REST)

---

## Risques identifiés au départ et comment ils ont été traités

| Risque | Traitement |
|---|---|
| Scalabilité du store en mémoire (whiteboard) | Limite de 10 000 strokes par room avec purge des plus anciens. Documenté comme limite connue. |
| Un utilisateur non-admin qui dessine | Vérification `isRoomAdmin` avant tout traitement du stroke ou du clear. Erreur renvoyée au client si refus. |
| Partage d'écran par plusieurs utilisateurs simultanément | `screenShareStore` Map<roomId, socketId> : un seul partageur par room, la nouvelle entrée écrase l'ancienne. |
| Fuite mémoire lors des déconnexions | Nettoyage explicite du `screenShareStore` dans l'handler `disconnect`. |
| Signaling WebRTC sans vérification d'appartenance à la room | Risque résiduel mitigé par la nature même de WebRTC (les pairs négocient directement) — voir risques résiduels. |

---

## Risques résiduels

1. **Tableau blanc non persisté** : si le serveur redémarre, tous les tableaux blancs sont perdus. Une solution future serait de sérialiser le store en base ou en fichier à intervalles réguliers.

2. **Absence de validation d'appartenance à la room pour le signaling WebRTC** : les events `screenshare:offer/answer/ice-candidate` relaie vers n'importe quel `targetSocketId` sans vérifier que la cible est dans la même room. Un utilisateur malicieux connaissant un socketId externe pourrait tenter d'initier une connexion parasite.

3. **Limite de 10 000 strokes par room** : la purge des strokes les plus anciens peut provoquer une désynchronisation visuelle entre un client qui a tout l'historique et un nouveau client qui arrive après la purge (il recevra un état tronqué).

4. **Pas de persistance des notes en base côté Socket** : les handlers `note:created`/`note:deleted` sont de simples relais. Si un utilisateur arrive après la création d'une note, il ne verra que les notes créées après son arrivée, sauf si le frontend gère une récupération REST initiale.

5. **Authentification Socket.IO basée sur l'userId en mémoire** : le store anonyme n'est pas chiffré ni signé. En cas de collision d'UUID (extrêmement improbable) ou de reconstitution malicieuse de l'auth handshake, un utilisateur pourrait usurper une identité.

---

## Décisions techniques prises et leur justification

### Store en mémoire pour le tableau blanc

**Décision** : `Map<roomId, { strokes, lastCleared }>` en Node.js process memory.

**Justification** : La persistance SQL de chaque stroke (potentiellement des milliers par seconde) serait prohibitive en latence. Pour un usage pédagogique temps réel, la perte au redémarrage serveur est acceptable. Cette limite est documentée.

### Serveur comme relais pur pour WebRTC

**Décision** : Le serveur ne fait que relayer les messages de signaling (offer/answer/ICE) sans interpréter le contenu.

**Justification** : WebRTC est conçu pour être peer-to-peer. Le serveur comme relais de signaling est la pratique standard (architecture STUN/TURN séparée si nécessaire). Cela évite au serveur de gérer des flux média lourds.

### Vérification admin asynchrone via `roomModel`

**Décision** : Pour chaque `whiteboard:draw` et `whiteboard:clear`, une requête SQL vérifie que l'émetteur est bien le créateur de la room.

**Justification** : Plus sûr qu'une vérification en mémoire seule (le store anonyme pourrait théoriquement être corrompu). Contrepartie : légère latence ajoutée à chaque action de dessin.

### Notes comme relais sans état serveur

**Décision** : Les handlers de notes (`note:created`, `note:deleted`) ne maintiennent aucun état côté serveur.

**Justification** : Si une fonctionnalité de persistance des notes est souhaitée, elle doit être implémentée via des routes REST avec base de données. Le Socket.IO sert uniquement la synchronisation temps réel entre clients connectés.

---

## Limites actuelles de l'application

- **Pas de persistance du tableau blanc** : les dessins disparaissent au redémarrage serveur.
- **Pas de support multi-instance** : les stores en mémoire (whiteboard, screenShare, playlist, anonymousUser) ne sont pas partagés entre plusieurs instances Node.js. Un déploiement horizontal nécessiterait Redis ou une solution équivalente.
- **Pas de chiffrement des communications Socket.IO** : sans HTTPS/WSS en production, les échanges sont en clair.
- **Authentification anonyme** : les utilisateurs sont identifiés par un UUID stocké dans le localStorage du navigateur — pas d'authentification forte.
- **Pas de rate-limiting sur les events Socket.IO** : un client malicieux pourrait envoyer un volume massif de strokes ou d'events pour saturer le serveur.
- **Partage d'écran limité** : pas de serveur TURN configuré — le WebRTC peer-to-peer peut échouer derrière certains NAT/pare-feux restrictifs.

---

## Priorités si le projet continuait

1. **Persistance du tableau blanc** via PostgreSQL ou Redis (snapshot toutes les N secondes).
2. **Serveur TURN/STUN dédié** pour fiabiliser le WebRTC en environnement restrictif.
3. **Rate-limiting Socket.IO** pour protéger contre les abus (ex. : throttle sur `whiteboard:draw`).
4. **Architecture multi-instance** avec adapter Socket.IO Redis pour le scalout horizontal.
5. **Persistance des notes** via une table SQL dédiée + API REST.
6. **Tests automatisés** : tests d'intégration Socket.IO avec `socket.io-client` en environnement de test.
7. **Meilleure gestion des droits sur le signaling WebRTC** : vérifier l'appartenance à la room avant de relayer.
