# 🏟️ Système de Réservation de Terrains Publics - TeamUp

## 📋 Vue d'ensemble

Ce système permet aux utilisateurs de réserver des terrains sportifs publics en France en utilisant l'API Data ES (Recensement des équipements sportifs). Le système gère la découverte de terrains, la création de demandes de réservation, la validation (automatique ou manuelle) et les notifications.

## 🏗️ Architecture

### Base de données

- **`public_equipments`** : Cache des équipements sportifs depuis l'API Data ES
- **`public_reservations`** : Réservations avec statuts et verrouillage
- **`reservation_notifications`** : Notifications pour les utilisateurs
- **`reservation_audit`** : Historique des actions d'administration

### Services

- **`EquipmentService`** : Gestion des équipements et synchronisation avec l'API Data ES
- **`ReservationService`** : Gestion des réservations et validation

### Pages

- **`/terrains`** : Découverte et recherche de terrains
- **`/reservation`** : Création d'une réservation
- **`/mes-reservations`** : Consultation des réservations utilisateur
- **`/admin/reservations`** : Back-office de validation

## 🚀 Installation et Configuration

### 1. Exécuter le schéma de base de données

```bash
# Exécuter le script SQL pour créer les tables
psql -d votre_base_de_donnees -f database/schema-reservations.sql
```

### 2. Installer les dépendances

```bash
npm install @react-native-community/datetimepicker
```

### 3. Configuration de l'API Data ES

L'API est configurée pour utiliser l'endpoint officiel :

```
https://data.es.opendatasoft.com/api/records/1.0/search/?dataset=recensement-des-equipements-sportifs
```

## 📡 API Endpoints

### 1. Découverte de terrains

```typescript
// GET /api/terrains (via EquipmentService)
const equipments = await EquipmentService.getEquipments({
  type: 'Terrain de football',
  property_type: 'Public',
  department: '75',
  limit: 50
});
```

### 2. Création de réservation

```typescript
// POST /api/reservations (via ReservationService)
const reservation = await ReservationService.createReservation({
  equipment_id: 'uuid',
  organizer_id: 'user_uuid',
  start_time: '2025-01-15T14:00:00Z',
  end_time: '2025-01-15T16:00:00Z',
  sport_type: 'Football',
  description: 'Match amical',
  max_participants: 10
});
```

### 3. Validation de réservation

```typescript
// PATCH /api/reservations/:id (via ReservationService)
await ReservationService.updateReservationStatus(reservationId, {
  status: 'approved',
  validated_by: 'admin_uuid',
  rejection_reason: 'Motif du rejet' // optionnel
});
```

## 🔄 Flux de réservation

### 1. Découverte de terrains

1. L'utilisateur accède à `/terrains`
2. Recherche et filtrage des équipements
3. Synchronisation optionnelle avec l'API Data ES
4. Sélection d'un terrain

### 2. Création de réservation

1. L'utilisateur remplit le formulaire de réservation
2. Validation des données côté client
3. Vérification des conflits côté serveur
4. Création avec verrouillage temporaire (10 min)
5. Notification de création

### 3. Validation

**Mode automatique :**

- Vérification de la date (futur)
- Vérification de la durée (max 4h)
- Vérification des conflits
- Validation/rejet automatique

**Mode manuel :**

- Interface d'administration
- Validation/rejet par un administrateur
- Motif de rejet optionnel

### 4. Notifications

- Notification de création
- Notification de statut (approuvé/rejeté)
- Notifications de rappel (optionnel)

## 🛡️ Gestion des conflits

### Verrouillage temporaire

- Chaque réservation créée verrouille le créneau pendant 10 minutes
- Évite les réservations concurrentes
- Nettoyage automatique des verrous expirés

### Vérification des conflits

```sql
-- Fonction de vérification des conflits
SELECT COUNT(*) FROM public_reservations
WHERE equipment_id = $1
  AND status IN ('pending', 'approved')
  AND (
    (start_time <= $2 AND end_time > $2) OR
    (start_time < $3 AND end_time >= $3) OR
    (start_time >= $2 AND end_time <= $3)
  );
```

## 📊 Fonctionnalités d'administration

### Back-office (`/admin/reservations`)

- **Statistiques** : Total, en attente, approuvées, rejetées
- **Validation manuelle** : Approuver/rejeter avec motif
- **Validation automatique** : Traitement en lot
- **Nettoyage** : Suppression des verrous expirés

### Actions rapides

- Validation automatique de toutes les réservations en attente
- Nettoyage des verrous expirés
- Synchronisation avec l'API Data ES

## 🔧 Tests et exemples

### Exemple de requête curl

```bash
# Récupérer les terrains
curl -X GET "http://localhost:3000/api/terrains?type=Terrain%20de%20football&department=75"

# Créer une réservation
curl -X POST "http://localhost:3000/api/reservations" \
  -H "Content-Type: application/json" \
  -d '{
    "equipment_id": "uuid",
    "organizer_id": "user_uuid",
    "start_time": "2025-01-15T14:00:00Z",
    "end_time": "2025-01-15T16:00:00Z",
    "sport_type": "Football",
    "description": "Match amical",
    "max_participants": 10
  }'

# Valider une réservation
curl -X PATCH "http://localhost:3000/api/reservations/uuid" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "approved",
    "validated_by": "admin_uuid"
  }'
```

### Test de conflit de réservation

```typescript
// Créer deux réservations pour le même créneau
const reservation1 = await ReservationService.createReservation({
  equipment_id: 'same_equipment',
  start_time: '2025-01-15T14:00:00Z',
  end_time: '2025-01-15T16:00:00Z',
  // ...
});

// La deuxième devrait échouer
try {
  const reservation2 = await ReservationService.createReservation({
    equipment_id: 'same_equipment',
    start_time: '2025-01-15T14:30:00Z', // Conflit
    end_time: '2025-01-15T15:30:00Z',
    // ...
  });
} catch (error) {
  console.log('Conflit détecté:', error.message);
}
```

## 🔮 Extensions possibles

### 1. Intégrations spécifiques par collectivité

- API de réservation directe pour certaines mairies
- Webhooks pour notifications externes
- Intégration avec des systèmes de gestion locaux

### 2. Fonctionnalités avancées

- Système de points/fidélité
- Réservations récurrentes
- Gestion des équipements
- Système de paiement
- Intégration calendrier

### 3. Améliorations techniques

- Cache Redis pour les équipements
- Queue de traitement (Bull/BullMQ)
- WebSockets pour notifications temps réel
- API GraphQL
- Tests automatisés

## 🚨 Gestion d'erreurs

### Erreurs courantes

- **API Data ES indisponible** : Utilisation du cache local
- **Conflit de réservation** : Message explicite à l'utilisateur
- **Verrou expiré** : Nettoyage automatique
- **Validation échouée** : Notification avec motif

### Fallback et résilience

- Cache local des équipements
- Retry automatique pour l'API Data ES
- Sauvegarde des données de réservation
- Logs d'audit complets

## 📈 Métriques et monitoring

### Métriques à surveiller

- Nombre de réservations créées/validées/rejetées
- Temps de réponse de l'API Data ES
- Taux de conflits de réservation
- Utilisation du cache

### Logs d'audit

- Toutes les actions d'administration
- Création/modification de réservations
- Erreurs et exceptions
- Performance des requêtes

## 🎯 Conclusion

Ce système fournit une solution complète pour la réservation de terrains sportifs publics en France, avec :

- ✅ Intégration avec l'API officielle Data ES
- ✅ Gestion robuste des conflits
- ✅ Validation automatique et manuelle
- ✅ Notifications utilisateur
- ✅ Interface d'administration
- ✅ Architecture modulaire et extensible

Le système est prêt pour la production et peut être étendu selon les besoins spécifiques de chaque collectivité.
