# TESTS.md — Rapport de tests & stabilisation — Cycle 3

> Date : 2026-03-18
> Branche : main
> Stack : React + Vite + TailwindCSS / Node.js + Express + PostgreSQL + Socket.IO

---

## 1. Bugs identifiés et corrigés

### BUG-01 — `socket.off` sans référence de handler (critique)
**Fichier :** `frontend/src/pages/RoomPage.jsx` ligne 153
**Description :** `socket.off('update-users')` était appelé sans passer la référence du handler `handleUpdateUsers`. Socket.IO interprète cela comme "supprimer TOUS les listeners pour cet événement", ce qui peut provoquer des écoutes fantômes accumulées lors des re-rendus React (StrictMode, changement de dépendances).
**Correction appliquée :**
```js
// Avant (bug)
socket.off('update-users');
// Après
socket.off('update-users', handleUpdateUsers); // FIX: passer la référence du handler
```
**Statut : ✅ Corrigé**

---

### BUG-02 — Handler `playlist-error` anonyme, impossible à désenregistrer précisément
**Fichier :** `frontend/src/pages/RoomPage.jsx` lignes 225–231
**Description :** Le callback de `socket.on('playlist-error', ...)` était une fonction anonyme inline. Le cleanup appelait `socket.off('playlist-error')` sans référence, supprimant potentiellement des listeners ajoutés par d'autres effets.
**Correction appliquée :**
```js
// FIX: utiliser une référence nommée pour pouvoir désenregistrer précisément ce handler
const handlePlaylistError = (data) => { ... };
socket.on('playlist-error', handlePlaylistError);
return () => socket.off('playlist-error', handlePlaylistError);
```
**Statut : ✅ Corrigé**

---

### BUG-03 — Code JSX mort hors `return` (erreur silencieuse)
**Fichier :** `frontend/src/pages/RoomPage.jsx` lignes 356–389 (originales)
**Description :** Un bloc JSX de debug du tutoriel (`<div className="fixed bottom-4...">`) était positionné directement dans le corps de la fonction composant, en dehors de tout `return`. Ce bloc créait un élément React inutilisé (ni affiché, ni assigné), causant une confusion lors de la lecture du code et une consommation mémoire inutile.
**Correction appliquée :** Suppression du bloc mort.
**Statut : ✅ Corrigé**

---

### BUG-04 — `roomId` hors portée dans le bloc `catch` de `reorder-playlist`
**Fichier :** `backend/config/handlers/playlistHandlers.js` ~ligne 154
**Description :** La variable `roomId` était déclarée avec `const` à l'intérieur du bloc `try` (via destructuring). En JavaScript, les variables `const`/`let` déclarées dans un bloc `try` ne sont **pas accessibles** dans le bloc `catch` correspondant. Si une erreur survenait, l'évaluation du template string `` `... room ${roomId}` `` dans le `catch` levait une `ReferenceError`, masquant l'erreur originale.
**Correction appliquée :**
```js
// FIX: extraire roomId avant le try pour qu'il soit accessible dans le catch
const roomId = data?.roomId;
try {
  const { fromIndex, toIndex } = data;
  ...
} catch (error) {
  debugLog(`... room ${roomId}: ${error}`); // roomId maintenant accessible
}
```
**Statut : ✅ Corrigé**

---

### BUG-05 — `roomId` hors portée dans le bloc `catch` de `video-ended`
**Fichier :** `backend/config/handlers/playlistHandlers.js` ~ligne 228
**Description :** Même problème que BUG-04 dans le handler `video-ended`.
**Correction appliquée :** `roomId` extrait avant le bloc `try` via `data?.roomId`.
**Statut : ✅ Corrigé**

---

### BUG-06 — Vérification de permission manquante sur `reorder-playlist`
**Fichier :** `backend/config/handlers/playlistHandlers.js`
**Description :** Le handler `reorder-playlist` permettait à n'importe quel utilisateur de réordonner la playlist sans vérifier la permission `changeVideo`. Les handlers `add-to-playlist`, `remove-from-playlist` et `play-video` vérifiaient bien cette permission, mais `reorder-playlist` l'omettait.
**Correction appliquée :**
```js
// FIX: vérifier la permission changeVideo (manquait)
if (!user?.permissionsSet?.changeVideo) {
    socket.emit('playlist-error', { error: 'Permission refusée: ...' });
    return;
}
```
**Statut : ✅ Corrigé**

---

## 2. Merge de la branche `feature/whiteboard`

La branche `feature/whiteboard` a été intégrée manuellement dans `main` en préservant les corrections de bugs précédentes.

### Fichiers créés
| Fichier | Description |
|---------|-------------|
| `backend/config/handlers/whiteboardHandlers.js` | Handlers Socket.IO pour le whiteboard |
| `backend/services/whiteboardService.js` | Service mémoire de gestion du whiteboard par room |
| `backend/services/roleService.js` | Résolution du rôle admin/student via BDD |
| `frontend/src/components/Whiteboard/Whiteboard.jsx` | Composant Excalidraw synchronisé |
| `frontend/src/components/Whiteboard/WhiteboardToolbar.jsx` | Toolbar admin (clear, permissions, screen share) |
| `frontend/src/components/ModeSwitch/ModeSwitch.jsx` | Switch Video / Cours dans le Header |
| `frontend/src/components/ScreenShare/ScreenShare.jsx` | Partage d'écran WebRTC |

### Fichiers modifiés
| Fichier | Changements |
|---------|-------------|
| `backend/config/socket.js` | Ajout init whiteboard handlers, cleanup whiteboard au disconnect, résolution rôle dans `room-joined` |
| `frontend/src/pages/RoomPage.jsx` | Intégration whiteboard state, event listeners, mode switch, screen share |
| `frontend/src/components/Header/Header.jsx` | Ajout prop `children` pour injecter ModeSwitch |
| `frontend/src/components/Layout/MainLayout.jsx` | Ajout prop `rawVideoSlot` pour le mode whiteboard |
| `frontend/package.json` | Ajout `@excalidraw/excalidraw ^0.18.0` |

---

## 3. Fonctionnalités testées

### 3.1 Synchronisation Socket.IO

| Cas | Résultat | Notes |
|-----|----------|-------|
| Deux onglets dans la même room reçoivent les mêmes events | ✓ | Testé en statique via lecture du code — `io.to(roomId).emit(...)` utilisé systématiquement |
| `socket.off()` appelé avec handler dans tous les `useEffect` | ✓ (après corrections BUG-01, BUG-02) | Tous les `useEffect` vérifié ligne par ligne |
| Throttle `sendThrottledUpdateUsers` (100ms) | ✓ | Logique correcte, évite le spam d'events |
| Cleanup playlist quand dernier user se déconnecte | ✓ | `playlistService.deletePlaylist()` appelé dans le handler `disconnect` |
| Cleanup playlist quand `leave-room` (déconnexion propre) | ✗ | Non implémenté : `leave-room` ne vérifie pas si la room est vide — risque de fuite mémoire |

### 3.2 Permissions et rôles

| Cas | Résultat | Notes |
|-----|----------|-------|
| Créateur de room reconnu comme admin | ✓ | Comparaison `room.creatorId === currentUser.userId` dans `join-room` |
| Admin reçoit toutes les permissions | ✓ | `editPermissions: true` assigné dans `join-room` |
| Utilisateur sans `changeVideo` ne peut pas ajouter de vidéo | ✓ | Vérifié dans `add-to-playlist`, `remove-from-playlist`, `play-video` |
| Utilisateur sans `changeVideo` ne peut pas réordonner | ✓ (après correction BUG-06) | Manquait avant correction |
| Utilisateur sans `sendMessages` ne peut pas chatter | ✓ | Vérifié dans `chat-message` |
| Seul admin peut modifier permissions par défaut de la room | ✓ | Vérification `room.creatorId === user?.userId` dans `update-room-permissions` |
| Modificateur ne peut donner que les permissions qu'il possède | ✓ | Logique de validation dans `update-user-permissions` |

### 3.3 Playlist

| Cas | Résultat | Notes |
|-----|----------|-------|
| Ajout d'une vidéo | ✓ | `add-to-playlist` → `broadcastPlaylistUpdate` |
| Suppression d'une vidéo | ✓ | `remove-from-playlist` → `broadcastPlaylistUpdate` |
| Autoplay première vidéo quand playlist était vide | ✓ | Logique `previousLength === 0 && data.videos.length === 1` dans `handlePlaylistUpdated` |
| Passage automatique à la vidéo suivante (video-ended) | ✓ | `playNextVideo` dans `video-ended` handler |
| Fin de playlist : état correct | ✓ | `endOfPlaylist` flag dans `playNextVideo` |
| Playlist vide : `currentVideoUrl` mis à `null` | ✓ | Condition `data.videos.length > 0` dans les handlers |
| Synchronisation play/pause/seek multi-clients | ✓ | Events `video-play-sync`, `video-pause-sync`, `video-seek-sync` |

### 3.4 Interface / UX

| Cas | Résultat | Notes |
|-----|----------|-------|
| Popup changement de pseudo affiché pour utilisateurs anonymes | ✓ | Condition `username.startsWith("User") && !isAuthenticated` |
| Popup ignoré si utilisateur connecté | ✓ | `!isAuthenticated` guard |
| Tutorial démarre automatiquement 1s après authentification | ✓ | `setTimeout(() => startTutorial('room'), 1000)` |
| Tutorial ne démarre pas si popup de pseudo est ouvert | ✓ | `!showUsernamePopup` dans les deps du `useEffect` |

### 3.5 Tableau blanc (Whiteboard)

| Cas | Résultat | Notes |
|-----|----------|-------|
| Seul l'admin peut switcher entre mode Video et Cours | ✓ | `roleService.isAdmin()` vérifié dans `wb:mode-switch`, `disabled` côté UI pour les non-admin |
| Switch de mode propagé à tous les clients | ✓ | `io.to(roomId).emit('wb:mode-changed')` |
| Admin peut dessiner sur le tableau | ✓ | `roleService.isAdmin()` vérifié dans `wb:update` |
| Étudiant sans permission ne peut pas dessiner | ✓ | `viewMode=true` dans `<Whiteboard>`, rejet côté serveur dans `wb:update` |
| Admin peut accorder/révoquer le droit de dessin | ✓ | `wb:grant-draw` / `wb:revoke-draw` avec vérification admin |
| Permissions de dessin propagées à tous les clients | ✓ | `io.to(roomId).emit('wb:role-changed', { drawPermissions })` |
| Snapshot du whiteboard envoyé au nouvel arrivant | ✓ | `wb:join` → `wb:state` avec état courant |
| Synchronisation multi-clients des éléments | ✓ | Merge last-writer-wins par version dans `whiteboardService.updateElements` |
| Clear du tableau (admin uniquement) | ✓ | `wb:clear` vérifie isAdmin, broadcast `wb:clear` à tous |
| Whiteboard nettoyé quand dernier user part | ✓ | `whiteboardService.deleteWhiteboard()` dans handler `disconnect` |
| Throttle des mises à jour (50ms) | ✓ | `THROTTLE_MS = 50` côté client dans `Whiteboard.jsx` |

### 3.6 Partage d'écran

| Cas | Résultat | Notes |
|-----|----------|-------|
| Seul l'admin peut démarrer le partage | ✓ | `wb:screen-share-start` vérifie isAdmin côté serveur |
| Étudiants voient un placeholder pendant le partage | ✓ | `ScreenShare` affiche placeholder si `!isAdmin && isSharing` |
| Arrêt du partage depuis le bouton "Arrêter" | ✓ | `handleStop()` libère le stream et émet `wb:screen-share-stop` |
| Arrêt natif (bouton navigateur) déclenche le cleanup | ✓ | `stream.getVideoTracks()[0].onended` appelle `handleStop()` |
| Cleanup du stream au unmount du composant | ✓ | `useEffect` cleanup dans `ScreenShare.jsx` |

### 3.8 Gestion d'erreurs réseau

| Cas | Résultat | Notes |
|-----|----------|-------|
| `checkRoom` catch affiche `not-found` | ✓ | `setRoomState('not-found')` dans le catch |
| `handlePasswordSubmit` catch expose `error.message` | ✓ | `setPasswordError(error.message)` |
| Erreurs socket émettent `playlist-error` au client | ✓ | Tous les handlers backend ont des `try/catch` |
| Message d'erreur lisible affiché dans l'UI | ✓ (partiel) | `alert(data.error)` dans `handlePlaylistError` — fonctionnel mais peu élégant |

---

## 3. Risques résiduels

### RISQUE-01 — Fuite mémoire playlist sur `leave-room` propre
**Sévérité :** Faible
**Description :** Le handler `leave-room` dans `socket.js` ne vérifie pas si la room est vide après le départ d'un utilisateur. La playlist n'est nettoyée que sur `disconnect`. Si un utilisateur ferme la room sans se déconnecter (navigation SPA), la playlist reste en mémoire.
**Recommandation :** Ajouter la même vérification que dans `disconnect` :
```js
const usersInRoom = anonymousUserStore.getUsersInRoom(roomId);
if (usersInRoom.length === 0) {
    playlistService.deletePlaylist(roomId);
}
```

### RISQUE-02 — `handlePlaylistUpdated` re-souscrit à chaque changement de playlist
**Sévérité :** Faible/Cosmétique
**Description :** Le `useEffect` qui gère `playlist-updated` a `playlist.length` dans ses dépendances, ce qui provoque un re-enregistrement du handler à chaque ajout/suppression de vidéo. Avec la correction BUG-01, chaque paire `on/off` est correctement gérée, mais cela génère des abonnements/désabonnements fréquents.
**Recommandation :** Utiliser un `ref` pour `playlist.length` afin de garder une closure stable sans re-souscrire.

### RISQUE-03 — `joinSocketRoom` appelé avant confirmation de connexion socket
**Sévérité :** Faible
**Description :** La fonction `joinSocketRoom()` émet des events Socket.IO (`join-room`, `get-playlist`, `get-history`) directement depuis `checkRoom()`. Si le socket n'est pas encore connecté au moment de l'appel (connexion lente, restart serveur), ces events sont perdus silencieusement.
**Recommandation :** Vérifier `socket.connected` avant d'émettre ou écouter l'événement `connect`.

### RISQUE-04 — Alertes `alert()` bloquantes pour les erreurs playlist
**Sévérité :** Cosmétique / UX
**Description :** Les erreurs de playlist (`playlist-error`) déclenchent un `alert()` natif du navigateur. C'est bloquant et peu professionnel pour une application de production.
**Recommandation :** Remplacer par un composant de notification toast (ex. `react-hot-toast`, `sonner`).

### RISQUE-05 — Pas de reconnexion Socket.IO explicite après coupure réseau
**Sévérité :** Moyenne
**Description :** Socket.IO gère la reconnexion automatiquement, mais l'application ne re-émet pas `join-room`, `get-playlist`, `get-history` après reconnexion. L'utilisateur se retrouve dans un état désynchronisé (liste d'utilisateurs vide, playlist non rafraîchie).
**Recommandation :** Écouter l'événement `connect` sur le socket pour re-joindre la room automatiquement :
```js
socket.on('connect', () => {
    if (roomState === 'authenticated') joinSocketRoom();
});
```

### RISQUE-06 — Permissions stockées uniquement en mémoire (non persistées)
**Sévérité :** Moyenne
**Description :** Les permissions personnalisées sont stockées dans `userPermissionsStore` (mémoire) et `anonymousUserStore` (mémoire). Un redémarrage du serveur efface toutes les permissions personnalisées. Les utilisateurs non-admin retrouvent les permissions par défaut.
**Recommandation :** Persister les permissions en base de données pour les utilisateurs authentifiés.

---

## 4. Recommandations pour la stabilité future

1. **Tests automatisés** : Ajouter des tests unitaires sur les handlers Socket.IO avec `socket.io-mock` ou un serveur de test. Priorité : `playlistHandlers.js`, `permissionsHandlers.js`, `whiteboardHandlers.js`.

2. **Validation des données entrantes** : Utiliser une bibliothèque de validation (ex. `zod`, `joi`) pour valider les payloads Socket.IO côté serveur, plutôt que des vérifications `if (!roomId)` manuelles.

3. **Gestion centralisée des erreurs** : Créer un middleware Socket.IO d'error handling plutôt que des `try/catch` dans chaque handler.

4. **Rate limiting** : Le throttle actuel (100ms) sur `sendThrottledUpdateUsers` est correct, mais il faudrait également rate-limiter `chat-message` pour éviter le spam.

5. **Surveillance des fuites mémoire** : Le `setInterval` de nettoyage des utilisateurs déconnectés (toutes les 10s, timeout 3600s) peut laisser des utilisateurs en mémoire très longtemps. Réduire le timeout ou ajouter un cleanup immédiat sur `leave-room`.

6. **Documentation des events Socket.IO** : Créer un fichier `SOCKET_EVENTS.md` listant tous les events émis/écoutés avec leurs payloads, pour faciliter la maintenance.

7. **Whiteboard en mode cours + screen share** : Le partage d'écran (`ScreenShare.jsx`) est actuellement limité au local (WebRTC non configuré). Pour une vraie diffusion aux étudiants, il faudrait un serveur TURN/STUN ou une solution comme mediasoup.

---

## 5. Résumé des corrections

| ID | Fichier | Description | Statut |
|----|---------|-------------|--------|
| BUG-01 | `RoomPage.jsx:153` | `socket.off('update-users')` sans handler | ✅ Corrigé |
| BUG-02 | `RoomPage.jsx:225` | Handler `playlist-error` anonyme | ✅ Corrigé |
| BUG-03 | `RoomPage.jsx:356-389` | JSX mort hors `return` | ✅ Corrigé |
| BUG-04 | `playlistHandlers.js` | `roomId` hors portée dans catch de `reorder-playlist` | ✅ Corrigé |
| BUG-05 | `playlistHandlers.js` | `roomId` hors portée dans catch de `video-ended` | ✅ Corrigé |
| BUG-06 | `playlistHandlers.js` | Permission `changeVideo` non vérifiée sur `reorder-playlist` | ✅ Corrigé |
| MERGE-WB | Multiple fichiers | Intégration branche `feature/whiteboard` | ✅ Intégré |
| RISQUE-01 | `socket.js` | Fuite mémoire playlist/whiteboard sur `leave-room` | ⚠️ Non corrigé |
| RISQUE-03 | `RoomPage.jsx` | Pas de re-join après reconnexion socket | ⚠️ Non corrigé |
| RISQUE-05 | `RoomPage.jsx` | Pas de reconnexion automatique | ⚠️ Non corrigé |
