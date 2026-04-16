import { VersionInfo } from '@start9labs/start-sdk'

export const v_1_45_0_4 = VersionInfo.of({
  version: '1.45.0:4',
  releaseNotes: {
    en_US:
      'Simplified documentation links to the upstream homepage plus package-specific README guidance.',
    es_ES:
      'Se simplificaron los enlaces de documentación a la página principal upstream y a la guía README específica del paquete.',
    de_DE:
      'Dokumentationslinks auf die Upstream-Startseite und die paket-spezifische README-Anleitung vereinfacht.',
    pl_PL:
      'Uproszczono linki do dokumentacji do strony głównej upstream oraz README specyficznego dla pakietu.',
    fr_FR:
      "Liens de documentation simplifiés vers la page d'accueil upstream et le README spécifique au paquet.",
  },
  migrations: {
    up: async () => {},
    down: async () => {},
  },
})
