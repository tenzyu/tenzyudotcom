# Castalia Security Notes

Castalia is local-first. The CLI does not create accounts, send telemetry, upload prompts, or provide cloud sync.

Prompt files may contain personal workflows, unpublished designs, project details, or private thinking. Treat the prompt directory as sensitive data.

Recommended sync options:

- Syncthing for device-to-device sync
- Git for explicit history and backup
- encrypted filesystem or encrypted sync target if prompts include sensitive material

Castalia should not become a browser extension by default. Browser extensions can require broad page access; Castalia should prefer OS-level invocation and clipboard insertion.
