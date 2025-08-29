# 🚀 Guide d'Installation du Système de Notifications TeamUp

## 📋 Prérequis

1. **Expo CLI** installé
2. **Compte Expo** avec un projet EAS configuré
3. **Supabase** configuré avec les permissions appropriées

## 🔧 Étapes d'Installation

### 1. Installation des Dépendances

```bash
npm install expo-notifications expo-device expo-constants
```

### 2. Configuration de la Base de Données

Exécutez le script SQL dans votre Supabase SQL Editor :

```sql
-- Exécutez le fichier : database/add-notifications-system.sql
```

### 3. Configuration des Notifications Push

#### A. Créer un Projet EAS

```bash
# Installer EAS CLI
npm install -g @expo/eas-cli

# Se connecter à Expo
eas login

# Initialiser EAS
eas build:configure
```

#### B. Configurer app.json

Remplacez `"your-project-id-here"` dans `app.json` par votre vrai Project ID EAS :

```json
{
  "extra": {
    "eas": {
      "projectId": "votre-vrai-project-id"
    }
  }
}
```

#### C. Créer les Assets de Notification

Créez ces fichiers dans le dossier `assets/` :

- `notification-icon.png` (96x96px pour Android, 1024x1024px pour iOS)
- `notification-sound.wav` (optionnel, pour les sons personnalisés)

### 4. Configuration des Politiques de Stockage

Dans Supabase Dashboard → Storage → Policies, ajoutez ces politiques pour le bucket "avatars" :

#### Politiques pour les Avatars :
- **"Users can upload their own avatars"** (INSERT)
- **"Avatar images are publicly accessible"** (SELECT)
- **"Users can update their own avatars"** (UPDATE)
- **"Users can delete their own avatars"** (DELETE)

#### Politiques pour les Événements :
- **"Authenticated users can upload event images"** (INSERT)
- **"Authenticated users can update event images"** (UPDATE)
- **"Authenticated users can delete event images"** (DELETE)

#### Politiques pour le Chat :
- **"Users can upload chat images"** (INSERT)
- **"Chat images are publicly accessible"** (SELECT)
- **"Users can update chat images"** (UPDATE)
- **"Users can delete chat images"** (DELETE)

### 5. Configuration des Permissions

#### iOS (Info.plist)
Ajoutez dans `app.json` :

```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["remote-notification"]
    }
  }
}
```

#### Android (AndroidManifest.xml)
Les permissions sont automatiquement ajoutées par le plugin expo-notifications.

### 6. Test des Notifications

#### A. Test Local
```javascript
import { NotificationService } from '../lib/services/notifications';

// Tester une notification locale
await NotificationService.sendLocalNotification(
  'Test Notification',
  'Ceci est un test de notification'
);
```

#### B. Test Push (nécessite un build EAS)
```bash
# Construire pour le développement
eas build --platform ios --profile development
eas build --platform android --profile development

# Ou pour la production
eas build --platform all --profile production
```

## 🔔 Fonctionnalités du Système

### Types de Notifications

1. **Événements Créés** (`event_created`)
   - Déclenché quand un nouvel événement est créé
   - Notifie les utilisateurs intéressés par ce sport

2. **Messages Reçus** (`message_received`)
   - Déclenché quand un message est envoyé dans un chat d'événement
   - Notifie tous les participants de l'événement

3. **Rappels d'Événements** (`event_reminder`)
   - Déclenché avant un événement (à implémenter)

4. **Participants Rejoints** (`participant_joined`)
   - Déclenché quand quelqu'un rejoint un événement (à implémenter)

### Préférences de Notification

Les utilisateurs peuvent contrôler :
- ✅ Notifications d'événements
- ✅ Notifications de messages
- ✅ Rappels d'événements
- ✅ Mises à jour de participants

## 🛠️ Utilisation dans le Code

### Enregistrer un Token de Notification

```javascript
import { NotificationService } from '../lib/services/notifications';

// Dans votre contexte d'authentification
if (user) {
  await NotificationService.registerNotificationToken(user.id);
}
```

### Obtenir les Notifications Non Lues

```javascript
const notifications = await NotificationService.getUnreadNotifications();
const count = await NotificationService.getUnreadCount();
```

### Marquer comme Lu

```javascript
await NotificationService.markAsRead(notificationId);
await NotificationService.markAllAsRead();
```

## 🔧 Dépannage

### Erreur "Project ID not found"
- Vérifiez que votre Project ID EAS est correct dans `app.json`
- Assurez-vous d'être connecté à Expo : `eas login`

### Notifications ne s'affichent pas
- Vérifiez les permissions de notification
- Testez avec une notification locale d'abord
- Vérifiez que les tokens sont bien enregistrés en base

### Erreurs de Base de Données
- Vérifiez que le script SQL a été exécuté complètement
- Vérifiez les politiques RLS
- Vérifiez les triggers et fonctions

## 📱 Interface Utilisateur

### Écran de Notifications
- Route : `/notifications`
- Affiche toutes les notifications non lues
- Permet de marquer comme lu
- Navigation vers les événements/messages

### Badge de Notifications
- Affiché dans le header principal
- Compte en temps réel des notifications non lues
- Mise à jour automatique toutes les 30 secondes

## 🚀 Déploiement

### Développement
```bash
npx expo start
```

### Production
```bash
eas build --platform all --profile production
eas submit --platform all
```

## 📞 Support

Pour toute question ou problème :
1. Vérifiez les logs de la console
2. Testez avec des notifications locales
3. Vérifiez la configuration EAS
4. Consultez la documentation Expo Notifications

---

**🎯 Le système de notifications est maintenant prêt ! Les utilisateurs recevront automatiquement des notifications pour les nouveaux événements et messages selon leurs préférences.** 