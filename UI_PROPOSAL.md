# TeamUp - UI Design System Proposal

## 🎨 Vision

Transformer TeamUp en une application premium avec un design moderne inspiré d'iOS, utilisant l'effet glassmorphism pour créer une expérience visuelle élégante et sportive.

## 🌈 Palette de Couleurs

### Light Mode

```css
--primary: #007AFF          /* Bleu iOS signature */
--primary-foreground: #FFFFFF
--secondary: #5856D6        /* Violet sportif */
--success: #34C759          /* Vert validation */
--warning: #FF9500          /* Orange alerte */
--destructive: #FF3B30      /* Rouge suppression */
--muted: #8E8E93           /* Gris texte secondaire */
--background: #F2F2F7       /* Fond principal */
--foreground: #000000       /* Texte principal */
--card: rgba(255,255,255,0.7) /* Carte glass */
--border: rgba(0,0,0,0.08)    /* Bordures subtiles */
--input: rgba(118,118,128,0.12) /* Fond input */
```

### Dark Mode

```css
--primary: #0A84FF          /* Bleu iOS dark */
--primary-foreground: #FFFFFF
--secondary: #5E5CE6        /* Violet dark */
--success: #32D74B          /* Vert dark */
--warning: #FF9F0A          /* Orange dark */
--destructive: #FF453A      /* Rouge dark */
--muted: #98989D           /* Gris texte secondaire */
--background: #000000       /* Fond principal */
--foreground: #FFFFFF       /* Texte principal */
--card: rgba(28,28,30,0.7) /* Carte glass */
--border: rgba(255,255,255,0.15) /* Bordures subtiles */
--input: rgba(118,118,128,0.24) /* Fond input */
```

### Glass Effects

```css
/* Light Glass */
--glass-light: {
  backgroundColor: rgba(255,255,255,0.6),
  backdropFilter: blur(20px),
  WebkitBackdropFilter: blur(20px),
  borderWidth: 1,
  borderColor: rgba(255,255,255,0.3)
}

/* Dark Glass */
--glass-dark: {
  backgroundColor: rgba(28,28,30,0.6),
  backdropFilter: blur(20px),
  WebkitBackdropFilter: blur(20px),
  borderWidth: 1,
  borderColor: rgba(255,255,255,0.1)
}
```

## 🏗️ Architecture des Composants

### Core Components

1. **GlassCard** - Carte avec effet givré
2. **GlassButton** - Bouton avec variations (solid/glass/ghost)
3. **GlassInput** - Champ de saisie élégant
4. **GlassModal** - Modal avec fond flou
5. **GlassHeader** - Header navigation translucide
6. **GlassBottomSheet** - Bottom sheet givré
7. **GlassTabBar** - Tab bar iOS-like

### Design Tokens

- **Radius**: 8, 12, 16, 20, 24px
- **Spacing**: 4, 8, 12, 16, 20, 24, 32px
- **Typography**: SF Pro Display (iOS) / Inter (fallback)
  - xs: 12px
  - sm: 14px
  - base: 16px
  - lg: 18px
  - xl: 20px
  - 2xl: 24px
  - 3xl: 32px
- **Shadows**:
  - sm: 0 1px 3px rgba(0,0,0,0.12)
  - md: 0 4px 6px rgba(0,0,0,0.15)
  - lg: 0 10px 15px rgba(0,0,0,0.20)
  - glass: 0 8px 32px rgba(0,0,0,0.10)

## 📱 Écrans Principaux

### 1. Écran d'accueil

- Header glass flottant avec avatar
- Cartes d'événements avec effet glass
- Gradient de fond subtil
- Tab bar glass en bas

### 2. Découvrir

- Map avec overlay glass pour les filtres
- Cards d'événements flottantes
- Bottom sheet glass pour les détails

### 3. Création d'événement

- Formulaire sur fond glass
- Inputs avec effet focus lumineux
- Date/Time pickers style iOS

### 4. Profil

- Header avec image de fond et effet blur
- Stats dans cards glass
- Actions dans boutons glass

## 🎯 Principes de Design

1. **Clarté** - Hiérarchie visuelle claire avec contrastes appropriés
2. **Profondeur** - Utilisation de layers et d'ombres pour créer de la profondeur
3. **Légèreté** - Interfaces aérées avec beaucoup d'espace blanc
4. **Cohérence** - Composants réutilisables et patterns uniformes
5. **Accessibilité** - Contrastes AA minimum, zones tactiles 44x44px

## 🚀 Implémentation Progressive

### Phase 1 - Foundation

- Configuration Tailwind avec tokens
- Contexte de thème
- Composants de base (Button, Input, Card)

### Phase 2 - Glass Components

- GlassCard avec blur effect
- GlassModal et BottomSheet
- Header et TabBar translucides

### Phase 3 - Screen Migration

- Écran d'accueil
- Liste et détails d'événements
- Profil et paramètres

### Phase 4 - Polish

- Animations et transitions
- Micro-interactions
- Dark mode refinements

## 📊 Métriques de Succès

- ✅ Tous les écrans supportent Light/Dark mode
- ✅ Effet glassmorphism sur les surfaces clés
- ✅ Contrastes WCAG AA (4.5:1 minimum)
- ✅ Performance: 60 FPS animations
- ✅ Zéro régression fonctionnelle

