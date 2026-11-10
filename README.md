<p align="center">
  <img src="icon.svg" alt="Linkding logo" width="21%" />
</p>

# Linkding on StartOS

> Everything not listed here behaves as documented upstream. See the Documentation section of `instructions.md` for upstream links.

Linkding is a self-hosted bookmark manager. Its source is at [sissbruecker/linkding](https://github.com/sissbruecker/linkding).

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [File Models](#file-models)
- [Dependencies](#dependencies)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Actions](#actions)
- [Tasks](#tasks)
- [Health Checks](#health-checks)
- [Backups and Restore](#backups-and-restore)
- [Limitations and Differences](#limitations-and-differences)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

## Image and Container Runtime

The package runs the unmodified upstream standard image, `sissbruecker/linkding`, with its entrypoint on x86_64 and aarch64. The running subcontainer is `linkding-sub`; user-management actions use temporary `linkding-action-sub` subcontainers.

## Volume and Data Layout

The writable `main` volume mounts at `/etc/linkding/data` and contains the SQLite database, secret key, favicons, previews, and assets. The unmounted `startos` volume holds package-owned state.

## File Models

`startos/store.json` records the owner username and whether setup is complete. The owner-password action writes this state; it does not store the generated password. On upgrades from older packages, the migration reads `main/store.json`, checks the owner account, and removes its plaintext password after recording the owner state. The old file is not otherwise used by current code. Hand edits to package-owned state are not supported.

The daemon passes `LD_SERVER_HOST` and `LD_SERVER_PORT` at each launch. Other application options are not exposed by this package.

## Dependencies

None.

## Network Access and Interfaces

The `ui` interface exposes the web application and API over HTTP on internal port 9090. StartOS manages its addresses and TLS wrapper.

## Installation and First-Run Flow

The owner-password action runs Linkding's database migrations and initial-superuser command before the service starts. It generates an owner password and displays it once; Linkding stores its hash in SQLite. Subsequent starts use the upstream entrypoint without passing a superuser password.

## Actions

Setting the owner password creates or changes the owner account password, reactivates that account if necessary, and restores its administrator privileges. The action requests confirmation and can be repeated; save the displayed credential because it cannot be retrieved again. User-management actions read or modify the SQLite database through temporary subcontainers. Creating a user returns its credentials; deleting one is permanent. The owner username is reserved, and the owner and last superuser are protected from removal or demotion. These operations do not intentionally restart the service. Connection information is read from the current interface and can be requested repeatedly without changing it.

## Tasks

A critical owner-password task appears while owner setup is incomplete and blocks startup. Successfully setting the password clears the task; it returns if the stored setup state is absent.

## Health Checks

The `primary` daemon checks whether port 9090 is listening, with the SDK's default grace period. A failure means the web process has not opened the port; inspect the service logs for startup or database errors. A listening port alone does not prove that login works.

## Backups and Restore

StartOS stops the service and copies both volumes wholesale; no paths are excluded. Restores of older backups that contain only `main` reconstruct owner state from the legacy store and database. Current backups must contain both volumes. Linkding's own startup handles database schema upgrades after restore.

## Limitations and Differences

1. The standard image does not include Chromium for server-side snapshots; browser-extension archiving remains available.
2. Advanced upstream environment options are not configurable through the package's actions.
3. Upstream blocks fetching metadata and previews from internal hosts by default; the package does not expose the upstream allowlist for exceptions.

## Quick Reference for AI Consumers

```yaml
package_id: linkding
image: sissbruecker/linkding
architectures: [x86_64, aarch64]
subcontainers: [linkding-sub, linkding-action-sub]
volumes:
  main: /etc/linkding/data
  startos: unmounted
file_models:
  - startos/store.json
  - main/store.json # legacy migration only
startos_managed_env_vars: [LD_SERVER_HOST, LD_SERVER_PORT]
dependencies: none
interfaces:
  ui: { type: ui, port: 9090 }
actions:
  - reset-owner-password
  - get-connection-info
  - add-user
  - get-user-list
  - remove-user
  - reset-user-password
  - set-user-admin-status
tasks:
  - { action: reset-owner-password, severity: critical }
health_checks:
  - primary
```
