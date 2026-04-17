![linkding logo](https://raw.githubusercontent.com/Scott-Sanderson/linkding-startos/master/icon.svg)

# linkding on StartOS

> **Upstream docs:** <https://linkding.link/>
>
> **Upstream repo:** <https://github.com/sissbruecker/linkding>
>
> Everything not listed in this document should behave the same as upstream linkding.

---

## Table of Contents

- [Image and Container Runtime](#image-and-container-runtime)
- [Volume and Data Layout](#volume-and-data-layout)
- [Installation and First-Run Flow](#installation-and-first-run-flow)
- [Configuration Management](#configuration-management)
- [Network Access and Interfaces](#network-access-and-interfaces)
- [Actions (StartOS UI)](#actions-startos-ui)
- [Formal User-Flow Matrix](#formal-user-flow-matrix)
- [Backups and Restore](#backups-and-restore)
- [Health Checks](#health-checks)
- [Dependencies](#dependencies)
- [Limitations and Differences](#limitations-and-differences)
- [What Is Unchanged from Upstream](#what-is-unchanged-from-upstream)
- [Contributing](#contributing)
- [Quick Reference for AI Consumers](#quick-reference-for-ai-consumers)

---

## Image and Container Runtime

| Property | Value |
| --- | --- |
| Image | `sissbruecker/linkding:1.45.0` |
| Architectures | `x86_64`, `aarch64` |
| Entrypoint | Upstream default (`bootstrap.sh`) |

---

## Volume and Data Layout

| Volume | Mount Point | Purpose |
| --- | --- | --- |
| `main` | `/etc/linkding/data` | Persistent linkding data (SQLite DB, generated assets, and app data) |

Additional StartOS-managed file:

- `main/store.json` stores the generated owner/admin credentials used by startup env and StartOS actions.

---

## Installation and First-Run Flow

On install, StartOS generates a single owner/admin account (default username `owner`) and stores credentials in `store.json`.

StartOS creates an install task for **Get Owner/Admin Credentials** so you can copy credentials and sign in immediately.

For single-user setups, use this owner/admin account directly. For multi-user setups, keep owner/admin for management and create additional users with StartOS actions.

The daemon passes `LD_SUPERUSER_NAME` and `LD_SUPERUSER_PASSWORD` from this stored state so linkding can initialize or recover the owner/admin account.

If you ever lose owner access, use **Reset Owner Password** from StartOS actions to rotate the owner password safely and keep StartOS/linkding credentials in sync.

---

## Configuration Management

| StartOS-managed | Upstream-managed |
| --- | --- |
| Owner/admin credentials lifecycle (`store.json`, retrieval, owner reset, user lifecycle actions), interface access guidance | Most application settings and behavior (`LD_*` options such as OIDC/auth-proxy/advanced request tuning, per-user preferences, API tokens, extensions, import/export, sharing) |

---

## Network Access and Interfaces

| Interface | Port | Protocol | Purpose |
| --- | --- | --- | --- |
| Web UI (`ui`) | `9090` | HTTP | linkding web app |

Access methods:

- Service Interfaces → Web UI → addresses page (source of truth for exact URLs)
- Private LAN/VPN URLs (`.local`, private domains, and private IP-based URLs)
- Public domain URLs on router or StartTunnel gateways (for example `linkding.birbs.biz`)
- Tor `.onion` address
- Copy and QR actions are available per URL from the addresses page

---

## Actions (StartOS UI)

**Admin & Access**

1. **Get Owner/Admin Credentials**: Shows configured owner/admin username/password from `store.json`.
2. **Get Connection Info**: Shows current private/public interface URLs with copyable values and QR codes.
3. **Reset Owner Password**: Safely rotate the configured owner/admin password and update both linkding + StartOS stored credentials.

**User Management**

1. **Add User**: Create a regular or admin user and return credentials for copy/paste handoff.
2. **Get User List**: Show all users and role/status flags.
3. **Remove User**: Select and delete a user (with safeguards against deleting the configured owner/admin account or last superuser).
4. **Reset User Password**: Select a non-owner user and set a new password.
5. **Set User Admin Status**: Select a non-owner user and grant or revoke admin privileges.

---

## Formal User-Flow Matrix

| Flow | StartOS Entry Point | Expected Outcome | Coverage |
| --- | --- | --- | --- |
| Owner onboarding | Install task → **Get Owner/Admin Credentials** | Owner signs in with generated credentials, then rotates password in app or via owner reset action | Covered |
| Owner lockout recovery | **Reset Owner Password** action | Owner password is reset in linkding and `store.json` together | Covered |
| Single-user daily usage | Linkding Web UI | Full bookmark manager functionality is used directly in app UI | Covered |
| Multi-user provisioning | **Add User**, **Get User List** | Operator can create and enumerate users from StartOS | Covered |
| Multi-user maintenance | **Reset User Password**, **Set User Admin Status**, **Remove User** | User lifecycle managed with safeguards for owner account and last superuser | Covered |
| LAN/VPN access sharing | Service Interfaces → Web UI addresses, **Get Connection Info** | Users receive copyable/QR private URLs (`.local`, private domains, VPN-reachable URLs) | Covered |
| Public access sharing | Service Interfaces → Web UI → Add Domain (router/StartTunnel), **Get Connection Info** | Users receive public domain URL(s), e.g. `linkding.birbs.biz` | Covered |
| Data continuity | StartOS backup/restore | linkding DB + assets + `store.json` retained through restore | Covered |

---

## Backups and Restore

Backups include the `main` volume, including linkding data and `store.json`.

On restore, StartOS restores the volume and then starts linkding with restored state.

---

## Health Checks

| Check | Method | Messages |
| --- | --- | --- |
| Web Interface | Port listening (`9090`) | Success: "The web interface is ready" / Error: "The web interface is not ready" |

---

## Dependencies

None.

---

## Limitations and Differences

1. Owner/admin credentials are StartOS-managed (`store.json` + actions), not manually managed via upstream `.env` flows.
2. Advanced upstream environment options (OIDC/auth proxy/DB engine tuning/request and logging knobs) are not yet modeled as StartOS actions and are not configurable from this package's current StartOS UI surface.
3. This package uses `sissbruecker/linkding:1.45.0` (not `-plus`), so server-side Chromium snapshot generation is not enabled; browser-extension-based archiving remains available.
4. StartOS exposes one `ui` interface. This is intentional; users still access full linkding functionality from the app itself (including admin pages and API paths).

---

## What Is Unchanged from Upstream

- Upstream linkding image and entrypoint behavior
- Upstream application features, API behavior, and data model
- Upstream on-disk data layout under `/etc/linkding/data`

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for build instructions and development workflow.

---

## Quick Reference for AI Consumers

```yaml
package_id: linkding
upstream_version: 1.45.0
image: sissbruecker/linkding:1.45.0
architectures: [x86_64, aarch64]
volumes:
  main: /etc/linkding/data
ports:
  ui: 9090
dependencies: none
startos_managed_env_vars:
  - LD_SERVER_HOST
  - LD_SERVER_PORT
  - LD_SUPERUSER_NAME
  - LD_SUPERUSER_PASSWORD
actions:
  - get-admin-credentials
  - get-connection-info
  - reset-owner-password
  - add-user
  - get-user-list
  - remove-user
  - reset-user-password
  - set-user-admin-status
```
