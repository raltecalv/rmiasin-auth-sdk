# RMIASIN Schema Version 0300

The RMIASIN specification describes a 40-segment, position-based identity string. Segment position defines meaning. This page is a developer reference; the SDK authenticates and verifies consent but does not construct or issue RMIASIN identities.

To register an identity, use the [official RMIASIN portal](https://rmiasin.raltecalv.com/).

## Segment map

| # | Segment | Summary | Change behavior |
|---:|---|---|---|
| 1 | System type declaration | `RMIASIN` | Immutable |
| 2 | Issuing ecosystem authority | `RALTECALV` | Immutable |
| 3 | Schema version | `SCHEMAVERSION0300` | Immutable |
| 4 | Identity class | Entity class, such as citizen, institution, asset, system, or AI agent | Immutable |
| 5 | Identity subclass | Subclass within the identity class | Immutable |
| 6 | Registration jurisdiction | Full jurisdiction name or defined special value | Formal process |
| 7 | Registration continent | Continent or defined special value | Immutable |
| 8 | Registration timestamp | UTC, `YYYYMMDDHHMMSS` | Immutable |
| 9 | Operational layer | Real-world, PearlMind, system, AI, or another defined layer | Formal review |
| 10 | Universe designation | Registered universe or not-applicable value | Migration |
| 11 | World designation | Registered world or not-applicable value | Migration |
| 12 | Planet of registration | `EARTHPRIMARY` or registered planet | PearlMind migration |
| 13 | Civilisation anchor | Real-world, unassigned, or registered civilisation | Formal process |
| 14 | World mode participation | Mode classification or not-applicable value | Profile settings |
| 15 | Trust tier | Pending through tier four, or not applicable | Tier progression |
| 16 | Registration channel | Portal, mobile app, API, migration, and other channels | Immutable |
| 17 | Cryptographic protection method | Standard, post-quantum, hybrid, or not applicable | Upgrade only |
| 18 | Privacy and consent configuration | Privacy/consent designation | Identity holder |
| 19 | Currency system linkage | Hard, soft, dual, restricted, or not applicable | Formal process |
| 20 | Unique sequential identifier | 15-digit zero-padded class sequence | Immutable |
| 21 | Entity origin classification | Human-born, institution-formed, migrated, and other origins | Immutable |
| 22 | Biometric verification status | Pending, verified, exempt, revoked, and other states | Status events |
| 23 | Lifecycle status | Pending, active, suspended, revoked, archived, and other states | Administrative |
| 24 | Subsidiary/institutional linkage | Independent, subsidiary, parent, guardian, and other linkages | Formal process |
| 25 | Galaxy designation | Registered galaxy | PearlMind migration |
| 26 | Star system designation | Registered star system | PearlMind migration |
| 27 | Planetary continent or landmass | Registered landmass | Location change |
| 28 | Nation or country of operation | Full nation name | Location change |
| 29 | State, province, or region | Administrative region | Location change |
| 30 | City, town, or settlement | Registered settlement | Location change |
| 31 | Geographic district, zone, or quarter | Registered district | Location change |
| 32 | Governing jurisdiction authority | Full governing authority | Follows location |
| 33 | Cross-system/interoperability | Access or interoperability designation | Formal process |
| 34 | AI interaction designation | AI interaction authorisation | Holder/administrator |
| 35 | Version iteration counter | `STRINGVERSION` plus six digits | Increments only |
| 36 | Expansion reservation one | `EXPANSIONRESERVEDONE` in schema 0300 | Reserved |
| 37 | Expansion reservation two | `EXPANSIONRESERVEDTWO` in schema 0300 | Reserved |
| 38 | Identity remarks | Remark value, such as `NOREMARK` | Administrative |
| 39 | HMAC-SHA256 integrity seal | 64 uppercase hexadecimal characters | Recomputed |
| 40 | Four-character checksum | Four uppercase hexadecimal characters; final segment | Recomputed |

## Construction and integrity notes

- The schema describes 40 ordered, hyphen-delimited segments. Parse according to the schema and expected positions; registered values may have punctuation rules that require more care than a blind split.
- Segment 39 is the HMAC-SHA256 integrity seal. Verification requires the authorised server-side secret.
- Segment 40 is the four-character checksum and is always last. The specification describes it as a fast integrity check that does not require the HMAC secret.
- Mutations create a new string version and audit record; the version counter advances, and the integrity fields are recomputed.
- The RSID short form is a lookup/reference identifier. A valid-looking format alone does not establish that the presenter controls the identity.

For official issuance and identity management, use the RMIASIN portal. Do not create or alter identity strings using this SDK.
