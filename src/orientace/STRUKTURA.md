# Struktura Projektu

## Složky a Jejich Účel

### 📁 src/
Hlavní složka obsahující zdrojový kód aplikace

### 📁 src/components/
Obsahuje všechny React komponenty

#### auth/
- `LoginForm.tsx` - Komponenta pro přihlášení (podnikatel/uživatel)
- `RegistrationForm.tsx` - Třístupňová registrace pro podnikatele, jednostupňová pro uživatele
- `UserTypeSelection.tsx` - Výběr typu uživatele (podnikatel/uživatel)

#### business/
- `BusinessCard.tsx` - Karta zobrazující informace o podniku
- `BusinessGrid.tsx` - Mřížka zobrazující podniky (2x2)

#### layout/
- `Layout.tsx` - Hlavní layout aplikace
- `Navbar.tsx` - Horní navigační lišta
- `Advertisement.tsx` - Komponenta pro zobrazení reklamy

#### ui/
- `SearchBar.tsx` - Vyhledávací pole
- `DropdownMenu.tsx` - Rozbalovací menu

### 📁 src/pages/
Obsahuje hlavní stránky aplikace
- `LoginPage.tsx` - Stránka přihlášení
- `RegisterPage.tsx` - Stránka registrace

### 📁 src/db/
Databázová vrstva aplikace

#### models/
- `User.ts` - Model a repository pro běžné uživatele
- `Business.ts` - Model a repository pro podnikatele
- `BusinessProfile.ts` - Model a repository pro profily podniků

### 📁 src/services/
Obsahuje business logiku
- `search.ts` - Služba pro vyhledávání podniků

### 📁 src/hooks/
Custom React hooks
- `useSearch.ts` - Hook pro vyhledávání

### 📁 src/types/
TypeScript typy a rozhraní
- `auth.ts` - Typy pro autentizaci
- `index.ts` - Obecné typy

## Hlavní Funkce a Jejich Umístění

### Autentizace
- Přihlášení: `src/components/auth/LoginForm.tsx`
- Registrace: `src/components/auth/RegistrationForm.tsx`

### Vyhledávání
- UI: `src/components/ui/SearchBar.tsx`
- Logika: `src/hooks/useSearch.ts`
- Backend: `src/services/search.ts`

### Správa Podniků
- Zobrazení: `src/components/business/BusinessGrid.tsx`
- Data: `src/db/models/BusinessProfile.ts`