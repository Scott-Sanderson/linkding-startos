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

---

## Configuration Management

| StartOS-managed | Upstream-managed |
| --- | --- |
| Owner/admin bootstrap credentials via `store.json` + action + env injection; optional user lifecycle actions (add/list/remove/reset/set admin status) | All other linkding settings and behavior from upstream defaults/documentation |

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

1. **Get Owner/Admin Credentials**: Shows configured owner/admin username/password from `store.json`.
2. **Get Connection Info**: Shows current private/public interface URLs with copyable values and QR codes.
3. **Add User**: Create a regular or admin user and return credentials for copy/paste handoff.
4. **Get User List**: Show all users and role/status flags.
5. **Remove User**: Delete a user (with safeguards against deleting the configured owner/admin account or last superuser).
6. **Reset User Password**: Set a new password for an existing user.
7. **Set User Admin Status**: Grant or revoke admin privileges.

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

1. Owner/admin bootstrap credentials are StartOS-managed (`store.json` + actions) rather than manually managed with docker-compose `.env`.

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
  - add-user
  - get-user-list
  - remove-user
  - reset-user-password
  - set-user-admin-status
```
