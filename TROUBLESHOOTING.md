# 🔧 Guide de Dépannage - TeamUp

## 🚨 **Problème : L'application ne fonctionne pas après installation**

### ✅ **Solutions vérifiées :**

#### 1. **Variables d'environnement manquantes**
**Problème :** L'application ne peut pas se connecter à Supabase
**Solution :** ✅ **CORRIGÉ** - Variables ajoutées dans `eas.json`

```json
"apk": {
  "android": {
    "buildType": "apk"
  },
  "env": {
    "EXPO_PUBLIC_SUPABASE_URL": "https://mvsbhsvadekfqdcrvgiw.supabase.co",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY": "votre_clé_ici"
  }
}
```

#### 2. **Permissions Android manquantes**
**Problème :** L'application plante lors de l'utilisation de la caméra/géolocalisation
**Solution :** ✅ **CORRIGÉ** - Permissions ajoutées dans `app.json`

```json
"permissions": [
  "ACCESS_COARSE_LOCATION",
  "ACCESS_FINE_LOCATION", 
  "INTERNET",
  "ACCESS_NETWORK_STATE",
  "CAMERA",
  "READ_EXTERNAL_STORAGE",
  "WRITE_EXTERNAL_STORAGE",
  "VIBRATE",
  "WAKE_LOCK"
]
```

### 📱 **Nouveau APK corrigé :**
**Lien de téléchargement :** https://expo.dev/artifacts/eas/xtv61Vh6PMCZZyxzz8BZ91.apk

### 🔍 **Comment diagnostiquer les problèmes :**

#### **Étape 1 : Vérifier les logs**
```bash
# Voir les logs de build
eas build:list

# Voir les logs détaillés d'un build
eas build:view [BUILD_ID]
```

#### **Étape 2 : Tester sur émulateur**
```bash
# Installer et tester sur émulateur
npm run build:apk
# Répondre "yes" quand demandé pour tester sur émulateur
```

#### **Étape 3 : Vérifier la connexion réseau**
- Assurez-vous d'avoir une connexion Internet
- Vérifiez que votre téléphone peut accéder à Supabase

#### **Étape 4 : Vérifier les permissions**
- Allez dans **Paramètres > Applications > TeamUp > Permissions**
- Activez toutes les permissions nécessaires :
  - 📍 **Localisation**
  - 📷 **Caméra**
  - 💾 **Stockage**

### 🛠️ **Problèmes courants et solutions :**

#### **1. L'application se ferme immédiatement**
**Cause :** Variables d'environnement manquantes
**Solution :** Utiliser le nouveau APK avec les variables incluses

#### **2. Impossible de se connecter**
**Cause :** Problème de réseau ou clés Supabase incorrectes
**Solution :** Vérifier la connexion Internet et les clés dans `.env`

#### **3. L'application plante lors de l'utilisation de la caméra**
**Cause :** Permissions manquantes
**Solution :** Aller dans Paramètres > TeamUp > Permissions > Caméra

#### **4. Impossible de voir les événements sur la carte**
**Cause :** Permissions de localisation manquantes
**Solution :** Aller dans Paramètres > TeamUp > Permissions > Localisation

### 📋 **Checklist de vérification :**

- [ ] Télécharger le nouveau APK
- [ ] Installer l'application
- [ ] Accorder toutes les permissions demandées
- [ ] Vérifier la connexion Internet
- [ ] Tester la connexion à l'application
- [ ] Tester la géolocalisation
- [ ] Tester l'upload de photos

### 🔄 **Si le problème persiste :**

1. **Désinstaller complètement l'ancienne version**
2. **Télécharger le nouveau APK**
3. **Installer la nouvelle version**
4. **Accorder toutes les permissions**
5. **Redémarrer le téléphone si nécessaire**

### 📞 **Support technique :**

Si le problème persiste après avoir suivi ces étapes, vérifiez :
- La version d'Android (minimum Android 6.0)
- L'espace de stockage disponible (minimum 100MB)
- La mémoire RAM disponible (minimum 2GB)

### 🆕 **Nouveau build disponible :**
**Version :** 1.0.0  
**Date :** 27/07/2025  
**Corrections :** Variables d'environnement + Permissions Android  
**Lien :** https://expo.dev/artifacts/eas/xtv61Vh6PMCZZyxzz8BZ91.apk 