# Configuration Supabase pour TeamUp

## 🚀 Étapes de configuration

### 1. Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Cliquez sur "Start your project"
3. Connectez-vous avec GitHub ou créez un compte
4. Cliquez sur "New Project"
5. Choisissez votre organisation
6. Donnez un nom à votre projet (ex: "teamup-app")
7. Créez un mot de passe pour la base de données
8. Choisissez une région proche de vous
9. Cliquez sur "Create new project"

### 2. Récupérer les clés API

1. Dans votre projet Supabase, allez dans **Settings** > **API**
2. Copiez :
   - **Project URL** (ex: `https://your-project.supabase.co`)
   - **anon public** key (commence par `eyJ...`)

### 3. Configurer les variables d'environnement

1. Créez un fichier `.env` à la racine de votre projet TeamUp
2. Ajoutez vos clés :

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Créer la base de données

1. Dans Supabase, allez dans **SQL Editor**
2. Cliquez sur "New query"
3. Copiez tout le contenu du fichier `database/schema.sql`
4. Collez-le dans l'éditeur SQL
5. Cliquez sur "Run" pour exécuter le script

### 5. Configurer l'authentification

1. Dans Supabase, allez dans **Authentication** > **Settings**
2. Dans **Site URL**, ajoutez : `teamup://auth/callback`
3. Dans **Redirect URLs**, ajoutez :
   - `teamup://auth/callback`
   - `exp://localhost:8081/--/auth/callback`
   - `exp://192.168.1.189:8081/--/auth/callback`

### 6. Activer les providers d'authentification

1. Dans **Authentication** > **Providers**
2. Activez **Email** et **Google** selon vos besoins
3. Pour Google, configurez OAuth avec vos clés Google

### 7. Configurer les politiques RLS

Les politiques Row Level Security sont déjà incluses dans le script SQL. Elles permettent :

- ✅ Lecture publique des événements actifs
- ✅ Création d'événements par les utilisateurs connectés
- ✅ Modification de ses propres événements
- ✅ Rejoindre/quitter des événements
- ✅ Envoi de messages dans les événements

### 8. Tester la configuration

1. Redémarrez votre serveur Expo :

   ```bash
   npm start
   ```

2. Testez l'authentification dans votre app

## 📊 Structure de la base de données

### Tables créées

1. **users** - Profils utilisateurs
2. **events** - Événements sportifs
3. **event_participants** - Participants aux événements
4. **messages** - Messages de chat
5. **user_locations** - Géolocalisation des utilisateurs

### Fonctions créées

- `increment_participants()` - Incrémente le nombre de participants
- `decrement_participants()` - Décrémente le nombre de participants
- `events_nearby()` - Recherche d'événements à proximité

## 🔧 Utilisation dans votre code

### Authentification

```typescript
import { AuthService } from '../lib/services/auth';

// Inscription
await AuthService.signUp('user@example.com', 'password', 'John Doe');

// Connexion
await AuthService.signIn('user@example.com', 'password');

// Connexion Google
await AuthService.signInWithGoogle();
```

### Événements

```typescript
import { EventService } from '../lib/services/events';

// Récupérer tous les événements
const events = await EventService.getEvents();

// Créer un événement
const newEvent = await EventService.createEvent({
  title: 'Match de foot',
  description: 'Match amical',
  location: 'Stade municipal',
  latitude: 48.8566,
  longitude: 2.3522,
  date: '2024-01-15',
  time: '14:00',
  sport_type: 'football',
  max_participants: 22,
  organizer_id: userId
});
```

### Chat en temps réel

```typescript
import { ChatService } from '../lib/services/chat';

// Envoyer un message
await ChatService.sendMessage(eventId, userId, 'Salut tout le monde !');

// Écouter les nouveaux messages
ChatService.subscribeToMessages(eventId, (message) => {
  console.log('Nouveau message:', message);
});
```

## 🚨 Dépannage

### Erreur de connexion

- Vérifiez vos clés API dans le fichier `.env`
- Assurez-vous que les URLs de redirection sont correctes

### Erreur de permissions

- Vérifiez que les politiques RLS sont bien créées
- Assurez-vous que l'utilisateur est authentifié

### Erreur de géolocalisation

- Activez l'extension `earthdistance` dans Supabase
- Vérifiez que les coordonnées sont au bon format

## 📱 Prochaines étapes

1. **Intégrer l'authentification** dans votre app
2. **Remplacer les données mock** par les appels Supabase
3. **Ajouter la géolocalisation** pour les événements à proximité
4. **Implémenter le chat en temps réel**
5. **Ajouter les notifications push**

## 🔗 Ressources utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Guide React Native](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [API Reference](https://supabase.com/docs/reference/javascript)
