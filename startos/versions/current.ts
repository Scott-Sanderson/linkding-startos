import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'
import { legacyStoreJson, storeJson } from '../fileModels/store.json'

export const current = VersionInfo.of({
  version: '1.47.0:0',
  releaseNotes: {
    en_US:
      'Linkding adds bookmark sorting and filtering, REST API CORS support, and protection against server-side request forgery. Owner passwords are no longer stored for later retrieval; use Set Owner Password to reset yours if needed. [Full upstream changes](https://github.com/sissbruecker/linkding/compare/v1.45.0...v1.47.0).',
    es_ES:
      'Linkding añade ordenación y filtros de marcadores, compatibilidad con CORS para la API REST y protección contra solicitudes falsificadas del lado del servidor. Las contraseñas del propietario ya no se almacenan para consultarlas; usa Set Owner Password para restablecerla. [Cambios completos](https://github.com/sissbruecker/linkding/compare/v1.45.0...v1.47.0).',
    de_DE:
      'Linkding ergänzt Sortierung und Filter für Lesezeichen, CORS für die REST-API und Schutz vor serverseitiger Anfragefälschung. Das Eigentümerpasswort wird nicht mehr zur späteren Anzeige gespeichert; bei Bedarf mit Set Owner Password zurücksetzen. [Alle Änderungen](https://github.com/sissbruecker/linkding/compare/v1.45.0...v1.47.0).',
    pl_PL:
      'Linkding dodaje sortowanie i filtrowanie zakładek, obsługę CORS dla API REST oraz ochronę przed fałszowaniem żądań po stronie serwera. Hasło właściciela nie jest już przechowywane do późniejszego wyświetlenia; w razie potrzeby użyj Set Owner Password, aby je zresetować. [Pełna lista zmian](https://github.com/sissbruecker/linkding/compare/v1.45.0...v1.47.0).',
    fr_FR:
      'Linkding ajoute le tri et le filtrage des favoris, la prise en charge CORS pour l’API REST et une protection contre la falsification des requêtes côté serveur. Le mot de passe propriétaire n’est plus conservé pour consultation ; utilisez Set Owner Password pour le réinitialiser si nécessaire. [Toutes les modifications](https://github.com/sissbruecker/linkding/compare/v1.45.0...v1.47.0).',
  },
  migrations: {
    up: async ({ effects }) => {
      const legacy = await legacyStoreJson.read().once()
      if (legacy) {
        if (!(await storeJson.read().once())) {
          await storeJson.merge(effects, {
            adminUsername: legacy.adminUsername ?? 'owner',
            adminConfigured: !!legacy.adminPassword,
          })
        }
        await legacyStoreJson.merge(effects, { adminPassword: undefined })
      }
    },
    down: IMPOSSIBLE,
  },
})
