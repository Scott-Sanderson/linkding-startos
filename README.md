# Linkding on StartOS

[Linkding](https://linkding.link/) is a self-hosted bookmark manager. Everything not described below behaves as documented upstream.

## Runtime and data

The package runs the upstream standard Docker image with its entrypoint. It supports x86_64 and aarch64. The `main` volume mounts at `/etc/linkding/data` and contains the SQLite database, secret key, favicons, previews, and assets. The unmounted `startos` volume contains the owner username and setup status. Both volumes are backed up. There are no service dependencies.

The **Web UI** interface serves HTTP on port 9090. Its available addresses depend on the gateways and interface settings chosen by the user. **Get Connection Info** lists the available private and public addresses.

## Owner and user management

On a fresh install, a critical task prompts the user to run **Set Owner Password**. The action generates a password, initializes the database using Linkding's management commands, creates the `owner` superuser if necessary, and displays the credentials once. The password is not kept in the StartOS store; run the action again to replace it. Linkding stores its password hash in SQLite.

**Add User**, **Get User List**, **Remove User**, **Reset User Password**, and **Set User Admin Status** manage additional users. Owner and last-superuser protections apply where appropriate.

The daemon's health check verifies that port 9090 is listening. Application settings not exposed by actions remain managed upstream; advanced environment options are not exposed by this package.

## Limitations

The standard image does not include Chromium for server-side snapshots. Browser-extension-based archiving remains available.

See [instructions.md](instructions.md) for user setup and [CONTRIBUTING.md](CONTRIBUTING.md) for development.
