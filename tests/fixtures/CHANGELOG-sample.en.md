<!--
  Test fixture: mirrors CHANGELOG-sample.md under the monolingual contract
  (2026-10-17). Versions/dates/sections align entry by entry with the Chinese
  file. Untranslated content is simply absent: 0.5.9 is missing entirely and
  0.5.5 ships without its "Fixed" section.
-->

# Changelog

## [0.6.0] - 2026-10-15

(A loose note under the version heading: neither a version heading nor an
entry, so it must not produce any changelog entry.)

### Added

- Sub-agent chips can now be filtered by name
- Remote approvals gain a batch mode
  Select multiple pending requests at once, then allow or deny them together
  Each batch action records one audit line per item
- The observatory supports timeline replay

### Fixed

- Fixed approval status drifting out of sync after a timeout
- Fixed the timeline misaligning in dark mode

### Engineering

- The sync script now pulls three sources (zh / en / capabilities)

## [0.5.5] - 2026-10-10

### Added

- Sub-agent run chips and the observatory
- Remote approvals support queueing
