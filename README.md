# TeamUp - Application Sportive Sociale

Une application React Native/Expo pour organiser et rejoindre des événements sportifs.

## 🚀 Fonctionnalités

- **Découverte d'événements** sportifs à proximité
- **Chat en temps réel** pour chaque événement
- **Géolocalisation** pour trouver des événements près de chez vous
- **Authentification** utilisateur avec Supabase
- **Interface moderne** avec Tailwind CSS (NativeWind)

## 🛠️ Technologies

- **Frontend** : React Native + Expo
- **Styling** : Tailwind CSS (NativeWind)
- **Backend** : Supabase (PostgreSQL + Auth + Realtime)
- **Navigation** : Expo Router
- **Maps** : React Native Maps (mobile) + Fallback web

## 📱 Installation

1. **Cloner le projet**
   ```bash
   git clone <votre-repo>
   cd TeamUp
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer Supabase**
   - Suivez le guide dans `SUPABASE_SETUP.md`
   - Créez un fichier `.env` avec vos clés Supabase

4. **Démarrer l'application**
   ```bash
   npm start
   ```

## 🔧 Configuration Supabase

### Étapes rapides :

1. **Créer un projet** sur [supabase.com](https://supabase.com)
2. **Récupérer les clés** dans Settings > API
3. **Créer le fichier `.env`** :
   ```env
   EXPO_PUBLIC_SUPABASE_URL=votre_url_projet
   EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon
   ```
4. **Exécuter le script SQL** dans `database/schema.sql`
5. **Tester la connexion** avec le bouton "Test DB" dans l'app

### Structure de la base de données :

- **users** - Profils utilisateurs
- **events** - Événements sportifs
- **event_participants** - Participants aux événements
- **messages** - Messages de chat
- **user_locations** - Géolocalisation

## 📱 Utilisation

### Écrans disponibles :

- **Home** (`/`) - Découverte d'événements
- **Events** (`/events`) - Calendrier et liste d'événements
- **Discover** (`/discover`) - Carte des événements
- **Chat** (`/chat`) - Messages des événements rejoints

### Fonctionnalités clés :

- ✅ **Recherche** d'événements par sport/location
- ✅ **Filtres** par date et type de sport
- ✅ **Géolocalisation** pour les événements à proximité
- ✅ **Chat en temps réel** par événement
- ✅ **Authentification** email/Google
- ✅ **Interface responsive** web/mobile

## 🔌 Services Supabase

### Authentification :
```typescript
import { AuthService } from '../lib/services/auth';

// Connexion
await AuthService.signIn('email', 'password');
await AuthService.signInWithGoogle();
```

### Événements :
```typescript
import { EventService } from '../lib/services/events';

// Récupérer les événements
const events = await EventService.getEvents();

// Créer un événement
await EventService.createEvent(eventData);
```

### Chat :
```typescript
import { ChatService } from '../lib/services/chat';

// Envoyer un message
await ChatService.sendMessage(eventId, userId, content);

// Écouter en temps réel
ChatService.subscribeToMessages(eventId, callback);
```

## 🚨 Dépannage

### Erreur de connexion Supabase :
- Vérifiez vos clés dans `.env`
- Assurez-vous que le script SQL a été exécuté
- Vérifiez les politiques RLS

### Erreur de carte sur le web :
- Les cartes natives ne sont disponibles que sur mobile
- L'interface web affiche un message informatif

### Erreur de bundling :
- Redémarrez le serveur Expo : `npm start`
- Videz le cache : `npm start -- --clear`

## 📊 Prochaines étapes

1. **Intégrer l'authentification** complète
2. **Remplacer les données mock** par Supabase
3. **Ajouter les notifications push**
4. **Implémenter la géolocalisation avancée**
5. **Ajouter des statistiques utilisateur**

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.

## 🔗 Liens utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Guide Expo](https://docs.expo.dev)
- [NativeWind](https://www.nativewind.dev)
- [Expo Router](https://expo.github.io/router)
