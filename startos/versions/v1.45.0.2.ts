import { VersionInfo } from '@start9labs/start-sdk'

export const v_1_45_0_2 = VersionInfo.of({
  version: '1.45.0:2',
  releaseNotes: {
    en_US:
      'Added a Get Connection Info action with copyable URL + QR output for private/public access, plus updated onboarding and docs guidance for interfaces and custom domains.',
    es_ES:
      'Se agregó una acción Get Connection Info con salida de URL copiable y código QR para acceso privado/público, además de mejoras en la guía de onboarding e interfaces/dominios personalizados.',
    de_DE:
      'Neue Aktion „Get Connection Info“ mit kopierbaren URLs und QR-Codes für privaten/öffentlichen Zugriff sowie aktualisierte Hinweise zu Interfaces und benutzerdefinierten Domains.',
    pl_PL:
      'Dodano akcję Get Connection Info z kopiowalnymi URL-ami i kodami QR dla dostępu prywatnego/publicznego oraz zaktualizowano wskazówki dotyczące interfejsów i domen niestandardowych.',
    fr_FR:
      'Ajout de l’action Get Connection Info avec URL copiables et QR pour les accès privé/public, avec des indications mises à jour pour les interfaces et domaines personnalisés.',
  },
  migrations: {
    up: async () => {},
    down: async () => {},
  },
})
