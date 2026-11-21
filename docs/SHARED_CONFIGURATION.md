# Shared event configuration

The current implementation is specified in [SIMPLIFIED_SETTINGS.md](SIMPLIFIED_SETTINGS.md). sharedEvent/live schema 2 becomes the only shared authority after an explicit Admin Save. This candidate has not been deployed.

The schema-1 config/published.json and append-only config/versions are retained unchanged as migration archives and private session snapshot compatibility inputs. They are no longer an Admin publication workflow. scripts/publish_config.py retains dry-run/local archive maintenance for tests; remote dispatch is refused. The former publication Action and visible JSON controls are removed only after emulator and browser verification of the replacement flow.

Local public drafts and cached server-confirmed settings are separate from private per-tab rosters, draw sessions and results. Offline, concurrent edits, revision conflicts and active-session protection are documented and tested in the current specification.
