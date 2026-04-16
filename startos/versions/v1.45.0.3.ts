import { VersionInfo } from '@start9labs/start-sdk'

export const v_1_45_0_3 = VersionInfo.of({
  version: '1.45.0:3',
  releaseNotes: {
    en_US:
      'Added a safe Reset Owner Password action, tightened owner-account guardrails in user actions, and expanded docs with a formal user-flow matrix and clearer StartOS/upstream boundaries.',
    es_ES:
      'Se agregó una acción segura Reset Owner Password, se reforzaron las protecciones de la cuenta propietaria en las acciones de usuario y se ampliaron los documentos con una matriz formal de flujos y límites más claros entre StartOS y upstream.',
    de_DE:
      'Sichere Aktion „Reset Owner Password“ hinzugefügt, Schutzmechanismen für das Owner-Konto in Benutzeraktionen verschärft und die Dokumentation um eine formale User-Flow-Matrix sowie klarere Grenzen zwischen StartOS und Upstream erweitert.',
    pl_PL:
      'Dodano bezpieczną akcję Reset Owner Password, wzmocniono zabezpieczenia konta właściciela w akcjach użytkowników oraz rozszerzono dokumentację o formalną macierz przepływów i jaśniejsze granice między StartOS a upstream.',
    fr_FR:
      "Ajout d'une action sécurisée Reset Owner Password, renforcement des garde-fous du compte propriétaire dans les actions utilisateur, et extension de la documentation avec une matrice formelle de parcours utilisateur et des limites plus claires entre StartOS et l'upstream.",
  },
  migrations: {
    up: async () => {},
    down: async () => {},
  },
})
