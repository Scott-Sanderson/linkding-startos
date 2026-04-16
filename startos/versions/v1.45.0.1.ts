import { VersionInfo } from '@start9labs/start-sdk'

export const v_1_45_0_1 = VersionInfo.of({
  version: '1.45.0:1',
  releaseNotes: {
    en_US:
      'Owner-first initialization: auto-generated owner/admin credentials with optional multi-user management actions.',
    es_ES:
      'Inicialización orientada al propietario: credenciales de propietario/administrador generadas automáticamente con acciones opcionales de gestión multiusuario.',
    de_DE:
      'Owner-first-Initialisierung: automatisch generierte Owner/Admin-Zugangsdaten mit optionalen Aktionen zur Mehrbenutzerverwaltung.',
    pl_PL:
      'Inicjalizacja owner-first: automatycznie generowane dane właściciela/admina z opcjonalnymi akcjami zarządzania wieloma użytkownikami.',
    fr_FR:
      "Initialisation orientée propriétaire : identifiants propriétaire/admin générés automatiquement avec des actions optionnelles de gestion multi-utilisateurs.",
  },
  migrations: {
    up: async () => {},
    down: async () => {},
  },
})
