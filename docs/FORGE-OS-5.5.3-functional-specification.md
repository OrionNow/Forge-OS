# FORGE-OS 5.5.3 — functional rules and capability specification

**Purpose:** an as-built, UI-agnostic baseline for rebuilding the application with a different interface.

**Snapshot:** the revised 5.5.3 runtime at source commit `08f0de7795d43b62e486fbdd0b4fe2194ff21586`, including the latest edited-files patch. The catalogue snapshot accompanying this document was extracted from that running version. This document does not change the program or introduce new game rules.

## Contents

1. [Scope and evidence](#1-scope-and-evidence)
2. [Capability map and conceptual model](#2-capability-map-and-conceptual-model)
3. [Catalogue, construction and interchange](#3-catalogue-construction-and-interchange)
4. [Component integrity, armor, heat and recovery](#4-component-integrity-armor-heat-and-recovery)
5. [Pilot checks, attacks and defenses](#5-pilot-checks-attacks-and-defenses)
6. [Shared encounters, identity and persistence](#6-shared-encounters-identity-and-persistence)
7. [Automation coverage and functional boundaries](#7-automation-coverage-and-functional-boundaries)
8. [Rebuild behavior examples](#8-rebuild-behavior-examples)
9. [Legacy state and data contracts](#9-legacy-state-and-data-contracts)
10. [Appendix A: stock catalogue](#appendix-a-stock-catalogue)
11. [Appendix B: source traceability](#appendix-b-source-traceability)
12. [Appendix C: non-rule capabilities](#appendix-c-non-rule-capabilities)

## 1. Scope and evidence

FORGE-OS is a mech/vehicle loadout builder, operational sheet and shared encounter-state tracker for a GURPS-influenced campaign. A current “character sheet” is principally a frame, its equipment and operating condition, plus pilot skill values. It is not a complete general-purpose human-character creation system.

The program supports preparing frames, preserving them in portable manifests, running several units together, resolving skill/attack/damage calculations, tracking component damage and heat, and sharing state and chat with a host and players. The GM and players still adjudicate substantial parts of combat.

This specification describes operations, data, formulas, permissions and state transitions. It does not prescribe screens, panels, tabs, context menus, keyboard bindings, visual layouts or a frontend framework. Existing source identifiers are included only where they define a compatibility contract or make an observation verifiable.

The executable rules at the snapshot take precedence over historical changelogs, explanatory tooltips and equipment prose. Several source functions have later replacement definitions. The effective final definitions were audited; selected ambiguous cases were also checked in a disposable browser/runtime. The current catalogue has **74 base records and 11 variants belonging to four tiered records**.

Use these distinctions throughout:

| Classification | Meaning for a rebuild |
|---|---|
| Automated | The running program calculates a value or changes stored state. |
| Assisted | A user explicitly requests an operation; the program performs its calculation or state change. |
| Manual / descriptive | The record describes a campaign rule, but the current engine does not execute that rule. |
| Dormant | Code or stored fields remain, but there is no ordinary available workflow using them. |
| Implementation discrepancy | Observable behavior differs from nearby descriptions, expected rules, or another entrypoint. Preserve it only by deliberate decision. |

This is a description of the current application, not a certification of canonical GURPS rules or a proposed balance revision. Many formulas are campaign-specific. A rebuild can retain the capabilities while intentionally correcting the discrepancies listed in sections 7–8.

## 2. Capability map and conceptual model

### Capability map

| Domain | Current capability |
|---|---|
| Content library | Define frames, systems and equipment; group records; provide variants; retain descriptive fields and arbitrary stat tokens. |
| Construction | Assemble modular knight frames or complete general/vehicle chassis; enforce ordinary EP installation limits and duplicate restrictions; provide an unlimited-EP work profile. |
| Allocation | Carry or mount equipment, use both hands, move/swap stations, assign utility hardpoints, track weapon magazines and spares. |
| Derived statistics | Combine chassis/core HP, movement, armor, Handling and Stability; apply supported armor, heat and Brittle effects. |
| Operational state | Maintain independent component HP, overrides, plating charges, heat and a pending stability check for each unit. |
| Skill resolution | Roll 3d6 against entered skills with supported general, attack, defense and targeting modifiers. |
| Attack resolution | Spend ammunition, calculate success and pending hits, generate outgoing damage results, and retain result provenance. |
| Incoming damage | Resolve numeric damage against a chosen component with divisor, rear/gap flags, heat-adjusted DR and sacrificial plating. |
| Recovery | Field-repair components, restore plating, attempt Engineering overrides, vent heat and undo supported state changes. |
| Encounter management | Maintain multiple independent units; assign ownership; hold/deploy, duplicate, delete and order them; share them through a table. |
| Collaboration | Remember usernames, reconnect, authorize renames, report presence, exchange chat and structured roll events, merge concurrent state changes. |
| Interchange | Export/import single-unit manifests, compatibility reports, operational recorder data, encounter collections and customized catalogue packages. |

### Core entities

| Entity | Meaning and identity |
|---|---|
| Catalogue definition | A reusable frame, equipment or core-system template. Catalogue names are currently important lookup keys. |
| Tier/variant | Alternate EP and performance data for a named catalogue definition. A variant is not a second independent installed identity. |
| Installed item | A copied definition with its selected variant and instance state, such as station, hardpoint, rounds and spare magazines. |
| Frame/chassis | A base structural definition, family, EP contribution, HP, paired DR, movement modes, SM, HND and SR. |
| Core system | Reactor, thruster or targeting selection on a modular knight. Each contributes to capacity and/or calculations. |
| Design/loadout | Chassis, cores, installed equipment and designation. |
| Operational unit/sheet | A design plus pilot inputs, component state, targeting profiles, pending hits, results and supported undo history. |
| Component/location | A damageable part derived from frame family and equipped weapons/shields. Current recorder compatibility depends on location order. |
| Pilot profile | Numeric skill inputs and general modifiers attached to the unit; not an independent full human-character sheet. |
| Weapon targeting profile | Persistent situational/maneuver inputs for a weapon within a unit. Current identity is name plus station. |
| Pending attack | The most recent attack's hit count/miss/consumed state for a weapon and its originating result identifier. |
| Impact | A requested HP/plating change on a receiving component, distinct from an attack or outgoing damage roll. |
| Table | Shared ordered unit collection, seats, revision, bounded event history and retry-deduplication state. |
| Seat/member | Stable member ID, username, host/player role, capability token, presence and chosen color. |
| Ownership assignment | A reference from a shared unit to a member ID; distinct from the unit's display name or prospective owner text. |
| Event/result | Chat, roll or supported informational output, with actor identity, optional unit identity and sequence metadata. |

### Important distinctions

A catalogue edit does not automatically rewrite an installed item copy. A pilot's username is not a frame designation. A member's host/player role is not its local work profile. Unit ownership is not unit visibility. A unit marked closed is not automatically hidden. An outgoing damage result is not an applied impact. A saved username or browser preference is not an encounter backup.

The same underlying frame can exist as a design, an independently running local unit, a shared unit, and a portable manifest. These representations carry different state and persistence guarantees.

### Work-profile capabilities

| Neutral capability | Existing profile name | Main behavior |
|---|---|---|
| Standard new design | Guest | Construct/edit equipment within ordinary capacity. |
| Manifest service/edit | Mechanic | Import an existing design or state for editing and recompilation. |
| Catalogue authoring | Research Staff | Modify the local content library and export a catalogue-bearing package. |
| Unlimited-capacity design | Overseer | Construct/edit with infinite EP capacity; other restrictions such as non-armament duplicates still apply. |
| Local encounter tracking | Imperial Intelligence | Import and operate multiple independent units locally. |
| Shared encounter participation | Live Data Intercept | Connect a remembered/new username to the shared table, with host/player authority. |

These profiles describe current capabilities. Their names, navigation and client-side access phrases are not a security model that a new interface must reproduce.

## 3. Catalogue, construction and interchange

### Conceptual entities

A **catalogue definition** is a reusable template. An **installed item** is a copy of a catalogue definition with live state such as mounting station, utility hardpoint, ammunition and spares. A **frame** supplies base capacity, structure, armor, movement, size, handling and stability. A modular frame additionally selects one reactor, one thruster system and one targeting system. A **sheet** contains its own frame, systems, equipment, designation, pilot inputs, telemetry, damage inputs, pending attack results, targeting settings and undo history. The catalogue and live sheet are not the same dataset: changing or deleting a catalogue definition does not automatically rewrite the copies already installed on a frame.

Record classes:

| Code | Domain category | Role |
|---|---|---|
| A | Armament | Repeatable equipment; a record with a `DMG:` token is treated as a weapon. |
| D | Defensive system | Non-repeatable by record name. A defensive record whose name contains the exact uppercase fragment `SHIELD` is treated as a shield. |
| U | Utility | Non-repeatable by record name; assigned Back or Legs hardpoint on mechs. |
| F | Frame | Base chassis definition and EP capacity. |
| R | Reactor | One modular system; grants/subtracts capacity and modifies chassis stats. |
| T | Thruster | One modular system; grants/subtracts capacity and modifies chassis stats. |
| G | Targeting | One modular system; capacity contribution and attack-targeting modifiers. |

A record carries category, unique name, signed integer EP value, stat-token string, subtype/group, model/class text, mass text, custom field label/value, tactical role, notes, two-handed flag, shoulder-fireable flag, tech level, and experimental flag. Class is internally stored as `GROUP // MODEL`. Group spelling is normalized to uppercase/condensed spaces for grouping and weapon-skill keys; display text is retained. Mass is descriptive text and is not summed or used as a build restriction. Tech level and experimental status are descriptive flags and do not gate installation.

Definitions are pipe-separated records with 14 current fields. Stats are space-separated `KEY:value` tokens; underscores encode spaces within a value. Unknown tokens are preserved as display data. Repeated `NOTE:` tokens are permitted. Many numerical readers use regexes against the first matching token rather than a fully typed rules model.

### Frame families and construction

- **Knight/modular mech:** `F` class text does not include `VEHICLE` or `GENERAL`. Building requires a frame plus one `R`, one `T`, and one `G`. Every system may have a selected variant. All three slots must be present before construction confirmation.
- **General chassis:** class text contains `GENERAL`. It is a complete non-modular mech, selected directly without requiring R/T/G. It still uses mech component locations and mounting rules. Stock general frames have their heat capacity and vent rate stored on the frame catalogue record.
- **Vehicle:** class text contains `VEHICLE`. It is selected directly without modular requirements; its damage-location model differs from mechs.

Choosing a new frame clears the previous equipment loadout, pilot skills, telemetry, undo history, pending stability check and other transient frame state. There is no cross-frame equipment migration operation.

Mech construction can mark a thruster as space-rated. That adds `ENV:space_capable` to its stats and subtracts 1 from its EP contribution. This is an extra capacity cost; it is not a change to the numerical movement formula. There is no automated environment legality/fuel simulation attached to it.

`L` and `S` in movement are described in source/token reference as **land** and **space** values. This is how the program labels them; vehicle names include fighters/helos, and campaign interpretation of their second movement value is not otherwise simulated. Absent modes can be `-` and remain non-numeric.

### Equipment-point rules

For a normal build:

`capacity = frame base EP + reactor EP + thruster EP + targeting EP`

`used EP = sum(installed A/D/U equipment EP)`

`remaining EP = capacity − used EP`

Core-system EP is a signed contribution to capacity, not an installed-item cost. Positive system EP increases capacity; negative system EP reduces it. Installed-equipment EP is a signed cost; zero and negative values are explicitly allowed on every custom record type, so negative item cost reduces used EP.

Installing an item is refused if the resulting used EP exceeds capacity. Normal installation also rejects a second non-armament record with the same exact name; armament may be installed repeatedly. Tier variants retain their record name, so non-armament tier alternatives are mutually exclusive by that same name. No mass, tech-level, experimental-status, crew-count or equipment-type compatibility budget is enforced.

Overseer mode changes capacity to Infinity and permits over-budget construction. It does not waive the non-armament duplicate-name restriction. Normal import is intentionally permissive: it can recover an over-budget or incomplete frame and retain its exported values.

Important validation boundary: the generated `VALID` loadout marker means only “a chassis exists and at least one installed equipment item exists.” Compilation does not independently re-check EP compliance, modular completeness, mount collisions or legality of imported records. It must not be interpreted as a comprehensive legal-build certificate.

### Chassis-stat aggregation

Input frame stats are converted to a compact representation: `ST/HPn DRa/b MOVExL/yS SM±n HND/SR±n/n`, with `BRITTLE:` preserved when present. Other frame tokens are not included by `toStatline`; in particular, frame notes, crew/cargo, and frame heat/vent metadata are not all preserved in that compact stat string. Heat for a known General chassis is subsequently obtained from its catalogue frame definition by name.

For ordinary modular systems, aggregate R/T/G stat strings are processed by `statWith`. If an imported frame is marked `CHASSIS STAT MODE: AGGREGATE`, core stat modifiers are suppressed to avoid applying them twice; core EP contributions are still counted.

For an HP base `H`, percentages `p_i`, and flat modifiers `h_i`:

`effective HP = max(1, round(H × (1 + sum(p_i)/100)) + sum(h_i))`

This minimum-1 clamp runs when a nonzero HP modifier is applied. With no HP modifier, the base token passes through; a malformed/custom base HP of 0 can therefore remain0. Stock frame values are positive.

For each numeric land/space movement base `M`, percentages `q_i`, per-mode flat modifiers `m_i`, and any separate dynamic move bonus `B`:

`effective mode = max(0, round(M × (1 + sum(q_i)/100)) + sum(m_i) + B)`

Absent `-` movement values remain unchanged. All percentages add before multiplication. Each mode rounds separately.

Armor first receives flat paired modifiers, floored at zero per value. Then the **largest** positive percent-DR bonus found in included stat strings applies to both values and rounds each result. Percent armor boosts do not stack.

Handling is base handling plus summed `HND:` integers. Stability is base stability plus summed `SR:` integers, floored at zero. Size is the frame's own SM; `statWith` does not add SM modifiers from systems.

A subtle implementation boundary matters for rebuilding: the installed-equipment contribution `armStats()` only selects entire equipment records containing `DR:+<integer>%`. Ordinary utility `MOVE:`, `HND:`, `SR:` and flat `DR:` tokens are therefore generally not chassis modifiers. A custom item containing a percent-DR token will bring its *whole* stat string into the calculation and can incidentally add HP/movement/handling/stability too. This is an implementation quirk to decide deliberately, rather than a clean universal stat-token rule.

Example: Medium Frame `150 HP, MOVE 9L/18S, HND +2, SR 2, EP5`, Standard Fusion Core `HP+50%, EP+3`, Standard Thrusters `MOVE+25%, EP+2`, and Standard Fire Control `EP0` produce **225 HP, 11L/23S, HND+2, SR2, capacity 10 EP**. The round-half-up behavior is JavaScript `Math.round`.

### Installed equipment and allocation

Installed records can be removed in builder/service roles. Installed equipment can be reordered, but only within its category; categories retain Armament → Defensive Systems → Utility ordering. This canonical category order also defines recorder-array alignment.

Mechs support left hand, right hand, both hands, left shoulder and right shoulder stations. A two-handed item must use Both Hands when hand-mounted; a one-handed item cannot use Both Hands. Shields can occupy one hand or either shoulder. An ordinary weapon/shield on a shoulder is treated as carried/stowed unless its shoulder-fireable flag makes that station an active firing/blocking station. Active-action eligibility is `LH/RH/BH`, or `BL/BR` when the shoulder-fireable flag is true.

Assigning an occupied station can perform an atomic swap. A swap is refused when more than one other item conflicts, when the displaced item cannot legally occupy the old station, or when that old station is also occupied. An unmounted item can take a station and release the former occupant. Both Hands consumes both hand slots. One item has at most one station. These choices are not an action-economy simulation: the program does not spend a Ready maneuver for mount changes.

Utility hardpoints are **Back** or **Legs**. FOOT ROLLERS defaults to Legs; other utilities default to Back. Multiple utilities can share the same hardpoint; there is no hardpoint-count budget. Old recorder location codes are normalized to Back except the explicit Legs code. Back utilities are associated with the Utility component being disabled; individual utility `HP:` tokens do not create independent utility HP pools. No general activation/cooldown interface is inferred from their prose tokens.

Vehicles do not require hand/shoulder allocation to attack: each weapon has a distinct weapon-housing location. Weapons are identified by category A plus a `DMG:` token. Shields are identified by a name containing `SHIELD`, including custom records.

### Ammunition model

An armament record with `AMMO:N(T)` has capacity N and nominal reload time T seconds. The time defaults to 1 when omitted. Current rounds lazily default to the full magazine; spare magazines lazily default to `SPARE:` or 2. A weapon without `AMMO:` has no ammunition depletion tracking. This applies to melee cartridge weapons as well as ranged weapons.

An attack spends the lesser of selected effective rate of fire and remaining rounds; the actual rounds spent cap resulting hits. Empty weapons cannot attack; a damage result already pending from the last shot can still be resolved. Manual current-round/spare values are accepted from 0 through 99 and are not clamped to the weapon's nominal magazine size. Reloading refuses a full/overfull magazine or zero spare magazines, consumes one spare, replaces current rounds with full capacity, and clears the legacy pending-damage flag.

With Fast Draw (Ammo) skill entered, reload makes that skill roll. Success labels the reload free; failure labels it as taking normal time. In both cases the reload actually happens. With no Fast Draw entered, reloading simply happens at the nominal time. No turn/time scheduler is advanced and no reload countdown is enforced.

### Catalogue management

Catalogue authority can create, edit, delete, categorize, subtype-group and reorder definitions; configure tier variants; and export a customized HTML package with the complete catalogue embedded. Creation/editing is local to the running document. It does not update a central catalogue database or automatically distribute the catalogue to connected clients. An export is the persistence/distribution mechanism.

Validation:

- Category must be A/D/U/F/T/R/G.
- Name and integer EP are required. Name comparison is exact/case-sensitive and names must be unique across the entire catalogue, regardless of category.
- Tech level must be an integer from 0 through 12; omitted value defaults to 8. There is a round-trip discrepancy: the catalogue editor accepts TL0 and exports it, but rebuilding that catalogue from its exported raw data maps TL0 back to TL8. Positive TL values survive.
- Stat tokens must be `non-whitespace-key:non-whitespace-value`, separated by spaces. Normal whitespace is collapsed. The system permits unknown token names and preserves them.
- Frame records must contain the six token keys ST/HP, DR, MOVE, SM, HND and SR. Their numerical contents are not comprehensively validated as a typed schema.
- Optional text fields reject pipes, backticks, newlines, `<` and `>`; subtype/model cannot contain `//`.
- Tier EP must be integer; tier stat/text fields follow the same syntax/safe-field checks. At least one tier is required for a tiered item.
- Missing optional fields on newly created records are filled with explicit data-unavailable placeholders.
- Record name input has a 64-character field limit, but `saveComponent` does not apply the `safeField` check to the name itself. A rebuild should not copy this validation gap accidentally.

A tier overrides EP, stats, mass, custom-field value and notes while inheriting category/name/subtype, role, custom-field label, tech level and flags. Tiers are separate from base definitions. Toggling a record back to non-tiered deletes its tier set. Renaming a catalogue record migrates its tier-set key. Deleting a record deletes its tier set but does not rewrite already installed copies.

Ordering is restricted to a category and normalized subtype group. There is no generic cross-category movement operation through reorder; changing a record category/subtype is an edit instead.

### Catalogue token coverage

Automated consumers include weapon DMG/ACC/RNG/ROF/RCL, AMMO/SPARE; shield HP/DR; percent armor; sacrificial PLATE/PLATE-USES/PLATE-HP; core HP/MOVE/HND/SR, HEAT/VENT; targeting ACC-ALL/type/band modifiers; and frame BRITTLE. Type-specific automatic attack/defense/heat rules belong in the other audit sections.

Treat the following as manual campaign rules unless another explicit calculation is identified: equipment weight, crew/cargo, FP costs, turns spent charging/deploying/recovering, individual-weapon HEAT:+N per shot/burst, cooldowns, ECM radius/sensor contests, special remote-bits conditions, nanite repair, anchor activation, overdrive/wings deployment, radiation per sortie, logistics/maintenance restrictions, special critical-failure destruction and damage-type-dependent armor. They appear in catalogue text but are not a universal effect engine. Examples include the railgun's “cannot fire on consecutive turns,” the maul's “any penetration forces stability,” remote bits' ECM/Utility restrictions, and hover-tank half-movement-on-locomotion-loss note.

Some dormant legacy helper functions exist for radiation, but their old existence is not evidence of an exposed current radiation-management feature.

### Manifest export and recovery

A frame export is human-readable text with a strict recognizable header, app version, designation, origin/clearance, issue timestamp, chassis/base stats, explicit core-system records, category-ordered installed equipment, optional flight recorder, import-compatibility notes, and the minimal validity/EP/signature footer. Exports preserve raw per-record EP and stats instead of depending solely on catalogue IDs.

A missing designation becomes `UNNAMED` on compile. A manually committed designation permits 1–24 letters/digits/spaces/underscores/hyphens/periods, cannot begin/end with space/period, and cannot exactly be Windows reserved CON/PRN/AUX/NUL/COM1–9/LPT1–9. Export filenames replace spaces with underscores and add `.txt`. Legacy slash-separated ID/model fields are joined with spaces on import.

The short loadout signature is deterministic but weak: it uses frame/core EP, used EP, equipment EP and item ordering, reduced modulo 65536. It is not a cryptographic authenticity check. The footer's VALID marker is also not proof that the build obeys all rules.

Import:

- Strips BOM and Windows CR; requires the Core Empire frame-manifest header and a readable chassis name.
- Missing/INVALID checksum marker creates warnings but does not prevent recovery.
- Supports current explicit per-record stat blocks, legacy named core-system descriptors, compact frame statlines, and frame `KEY:value` conversion.
- Resolves exact name/category/EP/stats matches to current catalogue definitions or exact tiers.
- Retains imported EP/stats when a known name differs, flagged **alternate**; associated catalogue metadata is preserved.
- Retains unknown records with generic imported metadata, flagged **missing**. Unknown equipment defaults to non-two-handed and non-shoulder-fireable because those traits are not encoded in ordinary manifest text.
- Infers an unknown frame family from its name: Vehicle/Tank/Fighter/Helo/Helicopter/Aircraft → Vehicle; General → General; otherwise Mech.
- Retains unknown frame capacity when exported; missing capacity defaults to zero with warning.
- Keeps first core record assigned to a slot, warns/omits duplicates or excess unassignable systems, recovers legacy name-only systems from the catalogue where possible, and otherwise retains placeholder systems.
- Leaves incomplete modular systems available with warnings rather than inventing replacement systems.
- For aggregate legacy frames, suppresses core-stat reapplication.
- Failed parsing restores the prior active-frame snapshot instead of replacing it with partial data.

Compatibility report records source filename/version, current export version, frame match/alternate/missing status and individual recovery warnings. Warnings can be carried into the next exported manifest. Mechanic imports open a frame for editing; solo-encounter imports append another independently stateful sheet.

### Flight-recorder payload

The text manifest can embed `ISB1.<base64 JSON>.<checksum>`, wrapped to 72 characters per line. It is versioned separately from the visible app release.

Current recorder v2 fields:

| Key | Meaning |
|---|---|
| v | Recorder schema version, currently 2; import also accepts v1. |
| h | HP array aligned with current component-location order. |
| k | Per-location engineering-override flags. |
| x | Per-location sacrificial-plating charges already spent. |
| e | Current heat. |
| p | Whitelisted numeric pilot/targeter inputs. |
| m | Mount code per category-ordered equipment item. |
| a | `[current rounds, spare magazines]` per ammo-tracked item, otherwise 0. |
| u | Utility hardpoint per equipment item, otherwise empty. |

Recorder checksum is a rolling character checksum modulo 65521, not encryption/authentication. Unsupported/malformed/bad-checksum recorder data does not reject the base frame; it is ignored with warning. V1 hardpoints are upgraded to default/empty.

Restoration is sectional. Mount arrays must match equipment count and use recognized codes. B1/B2 legacy shoulder codes become BL/BR. Ammo restoration requires a matching-length array; numbers clamp 0–99. HP restoration requires the exact location count and integer entries; HP clamps between negative and positive max on import, even though normal application has different limb/non-limb floors. Override arrays are coerced to booleans, plating-use counts clamp 0–9, heat clamps 0–capacity, and pilot data passes `cleanPilot`. Invalid sections are skipped independently where possible. If the recorder as a whole throws, the imported frame/equipment still survive.

Crucial scope: the recorder does **not** preserve undo history, console history, sheet aliases/order/color, multiplayer seat identity/ownership, pending hit queue, per-weapon saved targeter profiles or last roll results. A full live-table/sortie snapshot is a different persistence feature.

Tier round-trip limitations: standard weapon/item tier matching requires EP + exact normalized stat string; an exported custom tier is recoverable as alternate/missing even without its original catalogue. Expanded class text is not itself the canonical tier identity. Editor-exported catalogue HTML embeds current RAW and TIER separately and starts a clean session; it is a solo catalogue-bearing terminal, not a self-contained multiplayer server package. Hook/bridge/server remain separate runtime assets.

## 4. Component integrity, armor, heat and recovery

### Unit types and component model

`isMech()` treats both modular **Mech/Knight Frame** and non-modular **General Chassis** as mechs for hit locations, limb rules, equipment stations and utility hardpoints. Vehicle frames use a different component list.

Mech/general locations, in order:

1. Head / Targeting Equipment
2. Core
3. Utility
4. Crew Cabin
5. Left Arm
6. Right Arm
7. Left Leg
8. Right Leg
9. One additional location per installed shield: `Shield: <name>`.

Vehicle locations, in order:

1. Crew Cabin
2. One Weapon Housing per weapon, in the weapon list's order
3. Chassis
4. Engine
5. Locomotion
6. One location per shield.

Maximum HP is calculated from the combined, unheated chassis statline (`baseHP()` from `effBase0()`):

| Location | Maximum HP |
|---|---|
| Mech head, core, crew cabin | full combined ST/HP |
| Mech utility and each arm/leg | ceiling(combined ST/HP / 2) |
| Every non-shield vehicle location, including each weapon housing | full combined ST/HP |
| Shield | its own `HP:N` token, or 0 if absent |

This is a separate HP pool for each location, not shares of one total unit HP pool. For example, ST/HP165 creates three 165-HP locations and five 83-HP locations before shields.

The runtime telemetry structure holds parallel arrays of current HP, engineering-override flags and sacrificial-plating expenditure. `tel()` initializes missing entries to full HP / no override / no plating spent and trims arrays to the current location count. Indices, rather than persistent component IDs, identify locations in the current implementation.

### Component condition bands and functional effects

With current HP `h` and maximum `m`:

| Condition | Exact test |
|---|---|
| Healthy / OK | `h >= m` |
| Damaged / DMG | `0 < h < m` and `h > m/3` |
| Severe / CRIT | `0 < h <= m/3` |
| Disabled / DIS | `-m < h <= 0` |
| Destroyed / ERR | `h <= -m` and `h < 0` |
| Engineering override / OVR | override flag set and `-m < h <= 0`; this overrides the displayed disabled condition |

Ordinary incoming damage clamps mech arms/legs at `-m`; all other locations clamp at 0. Consequently, only mech limbs normally enter the negative-HP/destroyed band. A zero-HP head/core/crew cabin/vehicle location/shield is disabled, not in the negative-HP destroyed band.

Functional enforcement is limited:

- A hand-mounted weapon or shield becomes unusable when its required arm is disabled unless that arm has an active engineering override and is above `-m`.
- A both-hands item needs both arms usable.
- A shield with its own HP at or below 0 is unusable, independently of its arm.
- A vehicle weapon becomes unusable when its corresponding weapon housing is at or below 0 HP.
- A working shoulder-capable weapon mounted at a shoulder does not use an arm's disabled check.
- A disabled head limits the combined targeting-system plus Aim/Accuracy/Evaluate bonus to +1, with negative modifiers preserved. It does not universally turn off Sensors/EW/skill rolls.
- Disabled Utility produces a warning for utility equipment assigned to the Back hardpoint. This is not a general equipment-effect/interlock engine.
- Leg, engine and locomotion damage produces state/fault information but no automatic movement reduction was found.
- Damaged but still positive-HP limbs have no automatic skill penalty.
- Core or crew-cabin loss produces overall LOST status, but the current engine has no global rule preventing all attacks/skill rolls on a LOST frame. A working-arm weapon still passed its interlock in a runtime probe with Core HP0.

### Equipment stations and utility hardpoints

Mechs support left hand, right hand, both hands, left shoulder and right shoulder station identifiers. An ordinary one-handed item may occupy either hand or a shoulder slot; a two-handed item may occupy Both Hands or a shoulder slot; shields have hand or shoulder storage choices. Occupying a shoulder is not sufficient to fire a weapon unless the weapon also has the shoulder-capable flag (`sd`). A non-shoulder-capable weapon in a shoulder position is stowed for attack/damage purposes.

`setMount()` supports swapping with one conflicting item when that other item can legally take the moved item's previous station. It refuses swaps with multiple conflicts or an incompatible replacement station. Clearing a station leaves the item carried, rather than deleting it. Both Hands reserves both hand slots.

Utility equipment is assigned to Back or Legs, with legacy hardpoint codes normalized to Back. FOOT ROLLERS defaults to Legs; other utility items default to Back. There is no hardpoint-count capacity enforcement in `setHardpoint()`.

### Armor calculation and a shield compatibility quirk

Combined frame armor comes from the chassis statline, core-system adjustments and supported armor-percentage equipment. All current `ARMOR_REF` location entries are 0, so ordinary frame locations use the first number of the combined `DR A/B` pair.

Frame location armor in an encounter is:

`location DR = round(combined DR × heat multiplier)`

Heat multipliers are 1, 0.75 or 0.5 as described below. Shields use their own armor token and do not receive this heat multiplier.

**Current shield quirk:** `armorOf()` indexes the shield `DR:A/B` regex at group3 when `ARMOR_REF.Shield` is0. This selects **B**, not A. If the shield has a single `DR:A`, the fallback selects A. Runtime example: SMALL SHIELD has `DR:160/60 HP:40` and the engine returns DR60. The adjacent comment says 0 should mean first DR, so this is an implementation discrepancy worth deciding explicitly during a rebuild.

The presence of two frame DR values does not automatically select rear armor. Rear impacts apply the separate x0.5 flag below. There is no facing geometry engine.

Supported attribute aggregation in `statWith()`:

- Sum flat DR-pair adjustments from included systems.
- Apply only the largest positive `DR:+N%` percentage; percentages do not stack additively.
- Apply percentage armor after flat armor adjustments, rounding each DR value.
- Then apply the encounter heat reduction and round again.

The ordinary-equipment list included in this derived-stat pass is `armStats()`: items containing `DR:+N%`. Other equipment's movement, handling and special-effect text is generally not automatically aggregated.

### Incoming damage resolution

A damage action identifies one component and accepts a nonnegative raw damage number and a positive armor divisor. Both inputs may be fractional. Rear and armor-gap conditions are independent booleans.

The exact calculation is:

1. Obtain that component's current DR (including heat for frame locations).
2. `effective DR = component DR / armor divisor`.
3. Multiply effective DR by 0.5 if Rear is set.
4. Multiply by another0.5 if Gap is set. Both flags therefore produce x0.25 together.
5. `raw penetration = ceil(max(0, raw damage - effective DR))`.
6. Apply an eligible sacrificial-plating reduction, if any, with a second ceiling operation.
7. Subtract final penetration from that location's HP, clamping to 0 for non-limbs and to negative maximum HP for mech limbs.
8. Consume a plating charge when the plating rule applied.
9. If final penetration strictly exceeds half that location's maximum HP, create a pending stability check.

Example without heat/plating: DR650, divisor2, Rear+Gap means effective DR81.25. Damage200 produces `ceil(200-81.25)=119` penetration.

Verified combined example: ST/HP165 frame at Heat 5/10, nominal DR650 gives rounded heated DR488. Damage500, divisor2, Rear+Gap gives effective DR61 and raw penetration439. A custom 50% plate reduces this to `ceil(439×0.5)=220` HP damage.

Attack results and rolled outgoing damage are not automatically transferred onto an opposing unit. There is no automatic attacker-target relationship, shield interception, pass-through damage, overkill redistribution or wound-type multiplier in this incoming resolver. A user chooses the receiving unit/component and applies the numeric damage.

`hitMod()` contains a mech crew-cabin -8 value, but it is only used by an old selection-card renderer; the current attack formula does not automatically consume the chosen incoming location or that penalty.

### Sacrificial plating

Any installed item may supply these tokens:

- `PLATE:N`: percentage damage reduction, clamped1–95.
- `PLATE-USES:N`: charges per eligible component; default 1, minimum1.
- `PLATE-HP:any`: may protect already-damaged components. Without this exact mode, protection requires current HP at least maximum HP.

If several installed items supply plating, the engine selects the item with the greatest reduction percentage. It does not combine reductions. Ties follow installed order, rather than choosing maximum charges.

Each base component has its own spent-charge counter. Appended shield locations are excluded from plating eligibility. A plate triggers only on positive raw penetration, only while its component has a charge left, and only when the HP requirement passes. The reduction happens after armor:

`final penetration = ceil(raw penetration × (1 - reduction% /100))`.

A nonpenetrating hit consumes no plate. A plate-triggering hit consumes one charge even if subsequent HP saturation discards some overkill. With full-HP-only plating, a second charge cannot normally protect the same component again until it is repaired back to full.

Restoring a plate resets that component's spent counter to 0 without changing HP. Repairing an already full-HP component with spent plating also resets its plating. Repair All resets all plating counters.

### Repair and engineering override

Single-component field repair adds `ceil(maximum HP/2)`, capped at maximum HP. It does not require a skill roll, time expenditure, parts, a consumable or a repair tool. If the repair raises HP above 0, any override flag for that component is cleared.

Despite the destroyed status, field repair can currently repair a limb from `-maximum HP`. For an 83-HP arm, a repair changes -83 to -41; repeated repairs can restore it to positive/full HP. No replacement-only restriction is enforced.

Repair All sets all component HP to maximum, clears all engineering overrides and resets all spent plating. It does not clear heat or automatically dismiss an already pending stability check.

Engineering Override is a distinct action for mech arms/legs only. Eligibility is `-maximum HP < HP <=0`, no existing active override. A successful Engineering skill roll sets its override flag and keeps that limb functional until it reaches the destroyed threshold. HP is unchanged. Failure creates no automatic additional damage/condition. Destroyed limbs at `-maximum HP` cannot be overridden. A successful positive-HP repair clears override; Repair All clears every override.

The catalogue may describe other repair devices (e.g. nanite repair amounts or disabled-location restrictions); those descriptions do not replace this generic repair algorithm automatically.

### Heat pool and automatic effects

Heat capacity and base vent amount come from the installed reactor's `HEAT:N`/`VENT:N`; for a non-modular General Chassis they can come from its matching active catalogue frame record. If neither source exists, capacity is0 and the pool and passive zone effects are inactive. The explicit +2 Heat roll toggles remain available, as noted below. An imported unknown legacy frame does not gain a heat pool merely because descriptive tokens happen to mention heat.

Heat is treated as an integer between0 and capacity. Manual heat adjustments are clamped to this interval; an adjustment that cannot change the pool is refused. There is no overflow damage or shutdown beyond the cap.

| Zone | Exact boundary | Frame DR | Dodge modifier | Movement modifier |
|---|---|---|---|---|
| Normal | Heat below half capacity | ×1 | +0 | +0 |
| Danger | Heat at least half capacity, below cap | ×0.75 | +1 | +1 |
| Redline | Heat at cap | ×0.5 | +2 | +2 |

For an odd capacity such as7, Danger starts at4. These effects are implemented in encounter mode; the builder does not apply the live encounter heat modifiers. The heat movement bonus is added to every parsed L/S movement component in the effective displayed statline.

There are separate **skill/defense Heat** and **per-weapon attack Heat** toggles. Each grants +2 to its corresponding roll's effective skill. A valid roll with that section's Heat toggle enabled clears the toggle and adds1 heat, capped at capacity. A rejected roll with missing base skill does not consume it. These are independent of the passive +1/+2 Dodge bonus from heat zones; both can apply. The roll toggles are not gated on having a pool or remaining capacity: with capacity 0 they still grant +2 and clear afterward, but `heatTick()` adds no heat; at full capacity the +2 still works and the pool simply stays capped. A rebuild should decide whether to preserve this permissiveness.

The system does not automatically advance heat per round/turn, parse each weapon's `HEAT:+N/shot` or `HEAT:+N/burst`, consume afterburner heat, or cool over time. Such catalogue costs are manual rules unless represented by one of the explicit heat adjustments/toggles.

### Venting

Venting requires a nonzero heat pool and an Engineering base skill. It is an Engineering skill roll using ordinary non-attack modifiers, with success degrees in one-point margin steps. Let `V = max(1, configured VENT)` and `d = degrees of success`:

- Failure sheds V heat.
- Success sheds `max(V+1, V+d)` heat.
- Heat cannot fall below 0.

For VENT 2: failure removes2; success by 0 or1 removes3; success by 3 removes5. The later5.5.1 vent override is authoritative; the earlier function in the file used a different formula.

If the skill Heat toggle is used for the Engineering vent roll, its +2 applies and the usual +1 heat tick follows the vent result, so the net reduction is one lower (unless capacity/zero clamping changes it).

### Stability checks

A final penetrating hit **greater than**, not equal to, half a location's maximum HP generates one pending check. The test uses final penetration after plating, not raw damage or pre-plating penetration. There is no condition requiring the unit/location to survive the hit. A later qualifying hit replaces the existing pending record; this is not a queue.

The roll is **Piloting + current Stability Rating (SR) + non-attack skill modifier + skill Heat bonus**, not Piloting+Handling. The earlier tooltip mentioning HND is stale. SR is derived from combined chassis/core stats and any active Brittle adjustment.

A missing Piloting skill leaves the pending check unresolved. A valid attempt clears it. Success reports that the frame holds steady. Failure explicitly reports that no status was automatically applied and that the game master must adjudicate the effect. A pending check may also be dismissed without a roll.

### Brittle

A frame statline/catalogue record may carry `BRITTLE:N_SR_below_half_HP`, commonly N=-1. In encounter mode, when mech Core HP (or vehicle Chassis HP) is **strictly below** half that location's maximum HP, the signed N is added to the combined SR; final SR is clamped to at least 0. At exactly half HP, it is not active. It applies to current effective SR, stability checks and any generic degree-of-failure calculation that uses SR. It does not directly change HP, armor or movement.

`toStatline()` preserves the BRITTLE token when generating a compact chassis statline. The activation test is encounter-mode dependent in this implementation.

### Whole-unit status and integrity

The app has two different summary measures:

**Integrity percentage**: sum of nonnegative current HP across **all** locations, including shields, divided by sum of all location maxima; rounded to nearest percent. Negative limb HP counts as0.

**Frame status**:

1. Core/Chassis or Crew Cabin at0 or below means LOST.
2. If neither is lost but either is at or below two-thirds of base HP, status is CRIT.
3. Otherwise, use base locations only (shields excluded). Clamp their current HP at0 for scoring. Compute the mean of `current/max` over these locations, subtract0.08 per disabled location and0.02 per damaged-but-positive location.
4. Score thresholds: at least 0.98 NOMINAL; at least 0.85 LIGHT; at least 0.70 DEGRADE; at least 0.50 IMPAIR; otherwise SEVERE.

These summaries are informational, not a comprehensive global combat-validity gate. A rebuild should decide explicitly whether to preserve their current permissiveness.

### Undo and persistence boundaries

Local undo is per unit and retains up to 40 events. An undo snapshot stores the full telemetry object (HP, overrides, plating and heat) plus the pending stability-check record. Explicit damage, manual heat changes, repairs, plating restoration, successful override and vent result are snapshot-backed actions.

Undo does not snapshot the entire sheet. In particular it is not general undo for ammunition consumption, loadout edits, pilot skills, targeting/maneuver settings or roll history. The ordinary automatic Heat tick from a roll does not create a separate undo event. Reversing an earlier snapshot can incidentally rewind telemetry changes made afterward; multiplayer has additional event/merge handling described separately.

Individual manifest exports retain current HP, override flags, spent plating, heat, pilot inputs, stations, ammunition and utility hardpoints through a flight-recorder payload. The per-action undo history and pending stability record are not encoded in that compact recorder (the live server snapshot carries broader unit state; an encounter text export still uses manifests).

### Manual and dormant systems: explicit rebuild decisions

- No automatic damage transfer from an attack roll to another unit.
- No automatic turn sequence, action-point clock, recurring heat/cooling, or timing enforcement for devices.
- No generic rule interpreter for catalogue `NOTE`, `EFFECT`, `SHUTDOWN`, radiation, ammunition special traits or activation conditions.
- No movement geometry/pathfinding/facing or automatic leg/engine mobility penalty.
- No automatic critical-hit damage table, pilot injury, cabin casualties, reactor explosion or knockdown consequence from stability failure.
- Radiation functions and a `rad` pilot field remain in the source, but no ordinary current workflow invokes its adjustment function. The number can survive imports/exports, but there is no currently exposed radiation workflow or automatic dose application. Historical changelog text should not be read as current feature availability.
- Two chassis DR values do not imply implemented front/rear facing selection. The current resolver uses an explicit rear multiplier and has the shield-pair indexing quirk noted above.

These distinctions are important: a presentation-independent rebuild can preserve data and available actions while deliberately revisiting quirks, rather than copying undocumented behavior accidentally.

## 5. Pilot checks, attacks and defenses

### Pilot inputs and skill identity

A unit holds numeric pilot inputs for Piloting, Sensors, Electronic Warfare, Engineering, Fast Draw (Ammo), and weapon-family skills. Weapon-family keys are derived from the first part of an equipment class (before ` // `), normalized to uppercase/underscores and prefixed `w_`. All weapons with the same normalized family share one entered base skill. Installed unknown weapons also contribute their family. The input model distinguishes an absent/blank skill from numeric zero. Missing relevant base skill rejects the roll, rather than substituting a default.

Additional numeric fields include a general skill modifier, a separate attack/targeter modifier, vehicle piloting classification, Retreat, two Heat toggles and per-weapon targeting/maneuver inputs. Vehicle classifications are TANK/PLANE/HELO. The subtype is either explicitly selected or inferred from chassis name; this primarily changes labels, rather than providing a distinct vehicle-specific roll formula.

### Effective skill formulas

Let B be the entered base skill; HND and SR are the unit's current combined Handling and Stability. Let SMod be the general skill modifier, AMod the attack modifier, SkillHeat=2 when its skill Heat flag is enabled, AttackHeat=2 when its targeter Heat flag is enabled.

| Check | Effective skill |
|---|---|
| Full skill: Piloting, Sensors, EW, Engineering, Fast Draw | B + SMod + SkillHeat |
| Stability | B + SR + SMod + SkillHeat |
| Handling-type primitive | B + HND + SMod + SkillHeat; this primitive exists, but the ordinary maneuver/Piloting actions use the full-skill formula |
| Dodge | floor(B/2) + HND + SMod + SkillHeat + (Retreat ? 3 : 0) + heat-zone Dodge bonus |
| Turn Blow, Parry, Block | floor(B/2) + HND + SMod + SkillHeat + (Retreat ? 1 : 0) |
| Attack | Weapon-family B + AMod + AttackHeat + weapon-specific modifiers below |

No built-in `+3` base Dodge is added. Ordinary skill checks do not automatically add HND. Stability adds SR, not HND. Frame damage can change SR through the implemented BRITTLE trait, and heat can change Dodge as described elsewhere.

#### Attack modifiers

For a weapon with an `RNG:` token (the implementation's definition of ranged), add:

`rangePenalty(distance + targetSpeed) + rapidFireBonus(effectiveRoF)`.

For both ranged and non-ranged weapons, add:

`cover + relativeSize + targetingAndAim + AllOutDetermined + MoveAndAttack + RapidStrike`.

For melee/non-ranged Move and Attack, cap the resulting effective skill at 9 **after all modifiers**. Ranged Move and Attack has no such cap.

Weapon maximum and half-damage `RNG:x/y` values are displayed catalogue data. The attack calculator does not enforce those limits, automatically halve damage at range, or disallow attacks beyond the listed maximum. It does not apply hit-location penalties from the receiving unit's selected component. Component selection is a separate damage workflow; the Mech crew-cabin `-8` readout is not wired into attacker skill.

#### Range and speed

Effective range is the entered range in yards **plus** entered target speed in yards/second. It is a scalar sum, not a distance-over-time simulation. Values at or below 2 have no penalty. For larger values, use the first upper bound that contains the sum; beyond 200,000 the penalty remains -30.

| Upper bound | Penalty | Upper bound | Penalty |
|---:|---:|---:|---:|
| 2 | 0 | 1,000 | -16 |
| 3 | -1 | 1,500 | -17 |
| 5 | -2 | 2,000 | -18 |
| 7 | -3 | 3,000 | -19 |
| 10 | -4 | 5,000 | -20 |
| 15 | -5 | 7,000 | -21 |
| 20 | -6 | 10,000 | -22 |
| 30 | -7 | 15,000 | -23 |
| 50 | -8 | 20,000 | -24 |
| 70 | -9 | 30,000 | -25 |
| 100 | -10 | 50,000 | -26 |
| 150 | -11 | 70,000 | -27 |
| 200 | -12 | 100,000 | -28 |
| 300 | -13 | 150,000 | -29 |
| 500 | -14 | 200,000 | -30 |
| 700 | -15 | | |

Targeting-system range bands use **entered distance only** and a separate fixed scheme: CLOSE <=9 yd; MEDIUM >9 to 18 yd; FAR >18 yd. Those bands are not the range-penalty steps.

#### Cover and relative size

Standard cover choices are none=0, partial=-2, heavy=-4. Cover applies to ranged and melee attacks alike.

Relative-size modifier is `sign(targetSM-ownSM) × ceil(abs(targetSM-ownSM)/2)`. If either SM is absent, the modifier is zero. Thus target +8 versus own +6 gives +1; target +3 versus own +6 gives -2.

#### Rapid fire and effective RoF

Bonus table: 1–2 rounds=0; 3–4=+1; 5–8=+2; 9–12=+3; 13–16=+4; 17–24=+5; 25–49=+6; 50–99=+7; 100+=+8.

Ordinary effective ranged RoF is `max(1,min(30,floor(requestedRoF or1),weaponRoF))`. Weapon RoF reads an integer `ROF:` token; `ROF:X` means1; an absent token defaults to 30. The normal input validation also caps the request at30, so the +7/+8 bonus entries are normally unreachable through standard input.

Melee effective RoF is1, or up to 2 with Rapid Strike enabled. Switching active weapon clamps the requested rate to the selected weapon's supported rate. The targeter remembers rates per weapon.

**Existing edge case:** when a ranged weapon has fewer loaded rounds than requested RoF, ammunition consumption and hit count are capped by the rounds available, but the skill bonus is still calculated from requested/clamped RoF. A 5-round request with only1 round loaded can retain the +2 RoF skill bonus while producing at most 1 hit.

### Targeting equipment, Aim and Evaluate

A targeting system can contribute three additive integer stat tokens: `ACC-ALL`, `ACC-<weapon family>`, and `ACC-CLOSE`/`ACC-MEDIUM`/`ACC-FAR`. Family token normalization matches the stock family skill names. For custom names containing repeated punctuation/spaces, skill-key normalization replaces each nonalphanumeric character separately while targeting-token normalization collapses runs; custom keys can therefore diverge. Targeting equipment applies to weapons regardless of whether they are ranged.

For ranged attacks, a persistent Aim/Accuracy flag adds the weapon's integer `ACC:` value. The program does not track time spent aiming, turns of aim, bracing, concentration or disruption.

For non-ranged attacks, Evaluate can be off or +2, +4 or +6; enabling it without a stored choice defaults to+2. It does not accumulate by elapsed turns. Evaluate and Aim are persistent explicit inputs, not automatically consumed after an attack.

If the Head/Targeting Equipment component exists and its HP<=0, positive targeting-system bonus is first capped at+1, then the combined targeting + Aim/Evaluate result is capped at+1. Negative values remain penalties. This two-stage cap matters for unusual negative ACC catalogue data; for normal nonnegative bonuses it is effectively a combined +1 limit. General Chassis units have the same Mech location model. A vehicle without a Head location is treated as having targeting available.

A targeter profile is stored per `weapon name + mount station` within each unit. It remembers range, speed, cover, attack modifier, target SM, Aim, All-Out mode/last mode, targeter Heat, Evaluate amount/enabled state, Move and Attack, Rapid Strike amount/enabled state, and requested RoF. Active-weapon selection is local to the seat/unit rather than a synchronized opponent selection. Duplicate same-name weapons are distinguished by station in result identity; name+mount is the profile identity, not a permanent item ID.

### Dice, success, critical results and degree calculations

Every skill/check roll generates three independent uniform d6 and sums them.

Critical success (labelled CRITICAL HIT for any check): total<=4; or total 5 with effective skill>=15; or total 6 with effective skill>=16. These conditions are checked before critical-failure conditions, so a3/4 remains a critical success even for very low effective skill.

Critical failure: total 18; or total 17 with effective skill<=15; or roll total minus skill>=10. Otherwise success requires total<=effective skill **and** total<=16. Thus17 is always a failure, but may be ordinary failure at skill16+.

Success margin=`max(0,skill-total)`. Failure margin=`max(1,total-skill)`; an automatic failure at a high skill still has failure margin at least 1.

For successful attacks and parries, DoS=`floor(successMargin/RCL)`, with recoil default/minimum1. Most other implemented checks use one degree per point of success margin. Failure degree calculation is less uniform: RECOIL-tagged attack/parry rolls and Block use one degree per point of failure margin; most other checks use `ceil(failureMargin/max(1,SR))` unless an explicit failure increment is provided. A failed generic Sensors check can therefore have degrees tied to frame Stability.

Critical classification changes whether the roll succeeds and its result label. It does **not** automatically multiply damage, select a critical table, impose a mishap, bypass an opponent defense, or apply injury/status. Such consequences remain GM adjudication.

### Attack, pending hits and damage workflow

A valid attack requires a registered weapon, an entered applicable skill, a functioning component, and (for Mechs) an operational station. Hand stations are left/right/both. A shoulder station also qualifies when the weapon has the shoulder-capable flag. Unassigned or merely stowed equipment cannot attack. Disabled arms inhibit their hand-held weapons unless a recoverable limb has an active Engineering override. Vehicle weapons depend on their individual Weapon Housing.

1. Resolve the active weapon/profile and validate interlocks.
2. For magazine weapons, require at least 1 loaded round and consume `min(effectiveRoF,loadedRounds)` **before** rolling. Failed attacks still spend those rounds. Missing base skill is rejected before ammo is spent.
3. Roll the attack check.
4. On success, pending hits=`max(1,min(actualRoundsFired or effectiveRoF,1+floor(successMargin/RCL)))`.
5. On failure, store a missed queue with 0 hits.
6. A normal damage action consumes the pending hit count and rolls once per hit. Repeating it is rejected once consumed. A subsequent attack replaces, rather than accumulates with, this weapon's previous pending queue.

The queue is indexed by weapon index and guarded by weapon name; it also records the originating roll-card ID. It is included in live unit state so multiplayer redraws/reconnections do not inherently lose pending hits. Reordering indistinguishable same-name items is an identity edge to improve in a rebuild.

When no attack has ever been recorded for a weapon, a normal damage action falls back to 1 damage roll. A miss or an already-consumed queue does not get that fallback. An explicit forced count overrides the queue, is clamped1–30, does not consume ammunition and creates a separate result. The dedicated force-one operation permits an empty magazine but still checks component functionality and station interlocks.

A shot that empties the magazine can still roll its recorded damage. A separate temporary pending-damage flag prevents the empty-magazine check from blocking that sequence.

Damage notation supported by the roller is an integer number of dice with optional integer multiplier and required integer armor divisor, such as `6dx9(3)` or `64d(3)`. The parser is a prefix match, not a general dice-expression grammar. It does not implement arbitrary additions, fractional dice, variable dice, multiple damage types, or general expressions. Each hit rolls N d6, sums, adds any All-Out Strong bonus, then multiplies. The divisor is recorded with the damage result.

Attack results and outgoing damage do **not** automatically select an opposing unit, transfer damage/divisor into an impact request, roll its defense, or change its HP. The user/GM separately resolves the receiving component with incoming damage, divisor and situational flags. There is no automatic attacker-to-target combat transaction.

### Maneuvers

| Mode | Implemented behavior |
|---|---|
| Normal | No maneuver modifier; defenses available. |
| All-Out Determined | +4 melee or+1 ranged effective attack skill; active-defense action disabled. |
| All-Out Double | Melee-only mode and defense lockout. Description says two attacks against one foe; user performs separate attacks manually. No automatic second roll/action budget. |
| All-Out Feint | Melee-only mode and defense lockout. Description only; no opposed feint/defense-penalty automation. |
| All-Out Strong | Melee-only; adds `max(2,N)` to each N-die damage sum **before multiplier**; defense lockout. |
| All-Out Long | Melee-only mode and defense lockout. Description grants+1 yd reach; no geometry/reach engine. |
| Suppression | Ranged weapon with rated RoF>=5 only. Enabling raises requested RoF to at least 5. Defense lockout; no automated area selection or suppression-specific hit cap/skill rule. |
| Move and Attack | Mutually exclusive with All-Out; -2 ranged or-4 melee, with final melee skill capped9. Defenses restricted to Dodge or Block. No movement measurement/action budget. |
| Rapid Strike | Non-ranged only; -6 by default or-3 selected manually, effective melee RoF up to 2. The program does not verify Weapon Master/Trained by a Master prerequisite for-3. |

All-Out modes are validated against the active weapon and invalid All-Out modes clear when switching to a weapon that cannot use them. These explicit tactical states persist until changed; there is no automatic turn-end reset. All-Out modes are exclusive with Move and Attack. Rapid Strike is a separate toggle and is not explicitly excluded from those modes.

**Important Rapid Strike implementation difference:** the program treats its two-attack allowance through a single attack's RoF/hit formula. One attack roll can produce1 or2 hits according to margin/recoil. It does not automatically roll two independent attack checks at the penalty. A rebuild should deliberately choose whether to preserve this or implement two actual attacks.

### Active defenses and Retreat

Available defense types are Dodge; Turn Blow for Mech/General units; Parry for usable family-MELEE weapons; and Block for usable shields. A shield/weapon must be functioning and operationally mounted. `heldIn()` permits shoulder-capable weapons on shoulders, so the low-level Parry check can permit such a weapon even though explanatory text says hand-held.

All-Out disables the normal active-defense action. Move and Attack filters defense choices to Dodge/Block and rejects direct non-Block `def` checks through a wrapper. The domain functions are layered legacy functions; a rebuild should enforce these restrictions in a central rule service, rather than relying on the selected defense adapter.

Retreat adds+3 to Dodge and+1 to Parry/Block/Turn Blow. It clears after a valid active-defense roll, whether that roll succeeds or fails. It remains enabled if the roll is rejected for missing skill. Turn Blow success records that the pilot may choose a different incoming hit location; it does not automatically change the selected incoming component. A successful Block does not automatically redirect damage to a shield.

Sensors/Detection, EW/Stealth, Piloting, Engineering and their checks report results. They do not implement a target visibility system, contested detection/stealth resolution, global conditions, timed actions or movement simulation.

### Ammunition and reloading

An `AMMO:<magazine>(<reloadSeconds>)` stat token enables ammo accounting. Omitted reload time defaults1 second. Loaded rounds initialize to magazine size; spare magazines initialize from `SPARE:` or default 2. Counts are manually editable integers0–99; direct loaded-round editing is not capped at magazine size. There is no conservation rule between manually edited loaded rounds and spare magazines.

Reload rejects a full magazine or no spare. Otherwise a spare is consumed and the magazine becomes full, replacing any partial magazine. If Fast Draw is absent, record the weapon's reload time. If Fast Draw is entered, roll full Fast Draw: success reports a free action; failure still reloads but reports the normal time. There is no running timer or automatic turn-cost enforcement. Reload clears the temporary pending-damage flag but does not explicitly clear the separately stored pending hit queue.

### Heat-related check effects (final implementation)

The normal skill Heat flag and each weapon's targeter Heat flag are separate. They each give+2 to the corresponding check group. After a check is actually attempted with a relevant base skill, the matching flag turns off and heat increases by 1, capped at reactor heat capacity. The flag can be consumed even if no heat pool exists, but no heat point can be added then. Failure still consumes it. Damage rolls do not consume a Heat flag.

Heat-zone consequences are deterministic: below half capacity normal; at least half but below cap gives DR×0.75, Dodge+1, Move+1; at cap gives DR×0.5, Dodge+2, Move+2. (Shield DR calculation is separate and does not take the chassis heat DR factor.)

Final vent operation rolls full Engineering with ordinary general-skill modifiers. Let V=max(1,reactor VENT). On failure, remove V heat. On success, remove max(V+1,V+successMargin) heat. Remove no more than the current pool. If the skill Heat flag was enabled, the vent uses its+2, then the post-roll Heat flag consumption adds1 heat again. The earlier formula near the initial heat functions is obsolete.

### Roll records and provenance

A local roll/result object captures a unique ID and assigned mech owner name; originating seat ID; frame designation and frame color; action; summary; success/failure tone; detailed strings including individual d6, total, effective skill, margin and outcomes. A weapon damage result normally updates its originating attack record with every damage roll and a total. Forced/unmatched damage creates a separate record. Duplicate same-name weapons append station to identify them.

Ownership displayed in roll provenance is the unit's assigned owner, not necessarily the host/client who triggered the roll. Closed units or unresolved owners display Unknown; host-entered owner labels and unassigned names use neutral styling. The actual originating seat is retained as record author. Local cards capture an owner label when created; received or replayed cards resolve displayed ownership from the unit's current assignment. The shared server event therefore provides actor provenance, not an immutable historical owner label. Remote record updates are accepted only from the originating author; multiplayer transports structured, bounded data and renders escaped text.

### Implementation boundaries to preserve or reconsider

There is no initiative order, round counter, automatic turn budget, grid/position/range computation, target selection linking two units, automatic defense-versus-attack resolution, automatic damage application, damage-type wounding modifiers, critical table resolver, injury condition engine or attack-range enforcement in this combat implementation. These are absent capabilities, not inferred requirements for parity.

High-value rebuild decisions: permanent item IDs rather than index/name/mount identity; independent attacks for Rapid Strike; central enforcement of maneuver/defense interlocks; whether an ammo-limited burst should reduce its RoF skill bonus; whether to normalize the unusual SR-based failure-degree rule; and explicit treatment of advisory All-Out modes rather than implying they are fully automated.

## 6. Shared encounters, identity and persistence

### Three separate notions of role

The application combines three concepts that a rebuild should keep separate:

1. **Local work profile / clearance.** Guest creates frames under normal EP limits; Mechanic imports and edits an existing manifest; Research Staff edits the catalogue and exports an updated catalogue package; Overseer constructs frames with the unlimited-EP override; Imperial Intelligence runs a local encounter/telemetry session. The shared-table entry connects a username and enters an encounter. These are local application modes, not server user accounts. Research Staff and Overseer use hard-coded client-side access phrases (embedded shared phrases); three failed attempts trigger a client lockout presentation. They do not create server authorization credentials.
2. **Table seat role.** A connected seat is `host` or `player`, selected by table lifecycle. The first successful entry into the default table becomes host; later new seats become players. The host role is unrelated to the local Overseer EP override.
3. **Per-unit owner.** A sheet can reference a seat's stable member ID, be unowned/closed, or have a host-entered prospective owner name. Ownership determines most editing authority. Unit ownership survives username changes because the reference is the member ID, not the text name.

### Conceptual state model

A shared table contains:

- Table code (normal flow always uses `TABLE`), revision, creation/update times and an opaque host capability.
- A list of seats: stable member ID, secret capability token, callsign, host/player role, last-seen time and optional chosen color.
- An ordered list of units/sheets. Each has stable UID, display name, outline/color index, holding-bay flag (`hidden`), owner member ID or null, closed flag, per-sheet revision and a sheet-state blob.
- A shared event/log history with sequence numbers and a clear marker.
- Recently accepted impact IDs used to suppress retry duplication.

The sheet blob includes the frame/chassis, installed equipment and core systems, designation, pilot skills, telemetry, targeting state, pending hits, roll state, undo history and compatibility/import metadata. The active incoming-damage form, open dossier and animation intermediates are explicitly treated as local transient state during merges, even though some may also be present in saved blobs.

A local encounter can also hold multiple independent sheets and switch between them. Switching saves the previous sheet's state and restores the next. A rebuild should model units as independent entities rather than one mutable global sheet.

### Connecting, remembering and changing identity

#### Username validation

Usernames/callsigns are trimmed, 1–16 characters, begin with an ASCII letter or digit, and otherwise contain letters, digits, spaces, period, underscore or hyphen. `USER UNKNOWN` is reserved. Collision comparisons are case-insensitive.

#### Remembered identity

The browser stores the username and a table-seat record containing the secret token, member ID and role. A browser with a valid saved name attempts a quiet connection on startup; it does not need to enter the name again. Explicit shared-table connection also uses the saved name automatically. A browser with no usable saved name requests one.

Connection first tries resuming the saved token. A valid token's server-stored callsign is authoritative. A stale browser name cannot rename the seat back after a host or self rename. If the saved token is rejected because the table was recreated, the client attempts entry with the remembered name. Transient connection errors retry with backoff. An unavailable name active in another browser clears unusable saved credentials and allows a different name rather than trapping the user in automatic retries.

#### Offline recovery and trust assumption

If a token is lost but a matching callsign is offline, entry by that callsign reclaims the old seat and issues a new token. The stable member ID, role, owned units and saved color remain. If legacy duplicate seats exist, the server prefers one owning a unit, then the most recently seen. A matching name that is online within the last five seconds is refused.

**This is not authenticated account recovery:** knowing an offline callsign is sufficient. It can reclaim a host seat as well as a player seat. The system assumes a trusted gaming group. A public rebuild should replace this with a deliberate account/host-recovery design rather than copying it as a security guarantee.

#### Leaving and reconnecting

Leaving the active encounter work profile resets local work state but keeps the seat linked quietly for presence/chat; it is not equivalent to revoking the server capability. The explicit leave operation marks a seat offline immediately. Reset-local first attempts to flush pending changes, asks for confirmation, and requires an explicit force option to discard unsent changes; it releases the seat and re-authenticates using the remembered username. Explicit resync attempts a flush and requests a fresh table snapshot; the nonempty-local recovery guard still applies. It is not a guaranteed force-clear of owned local skills, loadout or heat.

#### Rename authority

A host may rename any seat; a player may rename only itself. The server enforces this, rejects invalid names and collisions, and serializes concurrent joins/renames through the table revision. Rename preserves member ID, token, role, unit ownership and the renamed user's online/offline state. A host renaming someone offline does not mark that other seat online. Clients absorb the canonical name from subsequent responses and update their local saved identity.

### Presence and attribution

A roster exposes username, member ID, host/player role, online state, current work area and chosen/default color. Current work area categories are Welcome, Frame Assembly, Frame Assembly with active editing, Research archive, Service Bay and Sortie. Location is process memory, refreshed by polls; it is not persistent database state. A seat is considered online when last seen less than five seconds ago.

Chosen colors are stored with the database seat; the host can set anyone's color and a client can set only its own. There is also a per-callsign browser backup so a chosen color can be reapplied if an ephemeral server is recreated. Untinted host defaults to amber. Untinted players receive deterministic colors derived from member IDs, with collision resolution among current player IDs. Colors identify seats; unit color/outline is a separate property.

Roll **display attribution** is the unit's assigned owner, not necessarily the person who triggered the roll. An assigned member uses that seat's name/color. A host-entered prospective name uses that name with a neutral color. A closed or unnamed/unassigned unit displays Unknown. Unit/frame identity uses its unit color; no selected unit color means a neutral frame name.

The server separately records the actual acting seat's member ID and callsign. That actor identity governs authorization to amend an existing roll card. Display attribution must not be mistaken for the actor who submitted the event. Local cards capture an owner label at creation, but received/replayed roll cards reconstruct it from the unit's current assignment. Displayed ownership is not a reliable immutable historical ownership record.

### Unit lifecycle and ownership

#### Creating and importing units

The host may import multiple frame manifests. A player's ordinary import is limited to one unit if it already owns one. A newly player-created unit is forcibly assigned to that player and made visible; a player cannot create a hidden unit through the server. A new host import is initially unowned and marked closed.

**One imported unit per pilot is not an absolute ownership cap.** The host can assign multiple units to the same player; the server permits a player to edit any unit it owns. A rebuild should decide whether a one-unit ownership rule is desired rather than assume it exists.

#### Host management actions

The host can rename display labels, duplicate units, delete units, reorder them, assign them to seats, mark them closed, and move them into or out of a holding bay. Host assignment can target an existing member. A host can alternatively enter an intended owner name; a client-side periodic check assigns the unit when an online callsign matches, clears the prospective name, and stores the stable member ID. That auto-assignment currently depends on an active host client, not an independent server rule.

Unit display names and prospective owner names are capped at 28 characters. Prospective owner text is whitespace-normalized and is host-only server data; player writes cannot set, replace or clear it.

#### Holding bay versus closed

These flags are distinct:

- **Holding bay (`hidden`)**: host-only unit. Other seats do not receive the unit, its roster entry or its unit-bound log lines.
- **Closed (`closed`)**: unassigned/unknown-owner designation used in attribution and encounter exports. It does not conceal the unit. A closed visible unit is still received by other seats with the ordinary non-owner redaction.

#### Deletion

The host may delete any unit. A player may delete its own unit. Deleting a player-owned unit frees the ordinary player's import allowance. Deleted UIDs are tracked locally to avoid an old poll reintroducing them before the deletion is acknowledged.

### Permission matrix and the actual trust boundary

| Capability | Host | Owner/player | Other connected player | Server enforcement |
|---|---|---|---|---|
| Receive a visible unit | Yes | Yes | Yes, with redaction | Yes |
| Receive a holding-bay unit | Yes | No | No | Yes |
| Edit full loadout, skills, heat or replacement telemetry | Any unit | Owned units | No | Yes for whole-state/rest writes |
| Roll skills, attacks and damage through normal application actions | Any unit | Owned units | Blocked | Mainly client guards; server accepts submitted log results and does not recompute rolls |
| Apply incoming damage as an additive impact | Visible/hidden unit as host | Visible unit | Visible unit | Allowed by server; broad shared-damage design |
| Undo | Any unit | Own unit | Only an action authored by that seat | Yes for additive undo |
| Repair, change stations, reload, alter heat through normal actions | Any unit | Owned unit | Blocked | Client guards plus server full-state ownership checks |
| Rename a username | Any seat | Self only | No | Yes |
| Change seat color | Any seat | Self only | No | Yes |
| Assign ownership / holding-bay state / prospective owner name | Yes | No | No | Yes |
| Create/import a unit | Multiple | One new owned unit if none owned | — | Yes for creation constraints |
| Delete a unit | Any unit | Owned unit | No | Yes |
| Change unit color | Any unit | Owned unit | No | Yes |
| Clear shared event history | Yes | Local display only | Local display only | Yes |
| End/delete the table through the legacy server API | Yes | No | No | Yes; no normal client end-table workflow is established |

Important qualifications:

1. The application calls other units “read only”, hides their pilot/attack controls and blocks many actions, but **shared incoming damage and authorized undo remain open**. The general denial message explicitly says damage and undo stay open. The later component-specific action entrypoint disables applying damage for a non-owner, while the general impact resolver and server additive-impact path remain open. This inconsistency should be resolved deliberately in a rebuild.
2. Redaction clears `pilot`, `natk` and `info`, and removes role/flavor text from equipment/core records. It leaves other frame state, equipment statistics, telemetry and targeting/roll data. It is not complete secrecy for an opponent sheet.
3. The server verifies identity/ownership and payload shape, not the full game rules. It accepts client-computed outcomes, signed/unsigned HP deltas within broad numeric limits, and log cards. Dice are calculated in the client; this is not an authoritative anti-cheat game server.
4. Client functions offer owners a unit display-name rename and visible-order changes. The current server applies metadata and ordering only for hosts, so client-owned name edits/order are **not reliably persisted/shared**. Treat this as a known implementation gap, not a confirmed durable feature.

### Shared event history and chat

The shared event stream includes structured roll cards, plain chat, and supported informational result lines. Each stored event has server sequence, generated event ID, server timestamp, acting member ID/callsign, optional unit UID, unit label, tone, safe HTML fallback, deduplication nonce, optional color and structured card data.

Chat is plain user text, capped at 500 characters, displayed locally immediately and then sent with a nonce to avoid echo duplicates. While connected it works across Welcome, construction, catalogue research, service and encounter contexts. Quiet non-sortie connections drain chat and update presence without importing the live sheet snapshot into a local builder. Their pushes contain chat only, never local builder state. A separate current-chat revision lets chat continue while the frame editor preserves its older encounter-merge base.

In active working modes, ordinary non-command text is chat; explicitly prefixed commands are interpreted as commands. Before choosing a work profile, numeric/profile-entry input retains its local entry behavior, though incoming chat can still be received by an already linked browser.

Roll records retain both concise summaries and detailed result data. A damage result can update an existing attack/result card. The server only lets the original acting member update a roll-card ID and requires an update flag, so another seat cannot rewrite its card merely by reusing the card identifier. Text and numbers still originate from clients; actor authorization does not certify mechanical correctness.

The default reduced log filter retains rolls **and player messages**. Turning it off includes routine/system lines. Shared clear is host-only and advances a clear sequence/marker; records at or before that point stop being sent to clients. It does not immediately erase the underlying snapshot history. Players may clear their own display without clearing anyone else's shared history.

Stored event history is capped to 200 records. An envelope returns at most the latest 80 eligible records newer than the requested sequence. Initial client catch-up displays at most 30 received records. Long HTML fallback lines are truncated locally, and the server sanitizes them; current structured cards are rebuilt from escaped text rather than arbitrary remote HTML.

### Synchronization semantics

The table is shared server state accessed through polling and revisioned updates, not peer-to-peer traffic. The client tracks a last accepted server snapshot (“shadow”), current local state, queued impacts/events and pending deletions/forced states.

#### Two classes of mutation

- **Structural/whole-state writes**: loadout/skill/targeting fields, replacement telemetry, metadata, new/deleted units, colors and ordering require the current table revision. A stale write receives a conflict response containing the current view.
- **Additive impacts and appended events**: HP/plating deltas, authorized inverse impacts, and event appends can be applied even when the sender's base revision is stale. This prevents independent hits from overwriting each other. Impact IDs and event nonces prevent duplicate acceptance on retries.

The server uses compare-and-swap on room revisions and retries conflicts up to eight times. Username join/rename writes also serialize against room revision so simultaneous claims cannot create duplicate names.

#### Client merge policy

Pending local edits survive ordinary polls and revision conflicts. The bridge merges base shadow, local state and incoming state field by field:

- Unchanged local field takes the incoming value.
- Unchanged remote field takes the local value.
- Equal local/remote values need no conflict.
- Numeric telemetry combines deltas (`incoming + local - base`).
- Undo stacks merge unique entries and retain at most 40.
- On an owned unit, that owner's value wins conflicting edits. An online remote owner also takes precedence over a host editing that pilot's copy.
- For unowned units the host's value normally wins; while the host is offline, the local last writer can prevail. Conflicts are reported with competing values rather than silently ignored.
- The damage-entry form, currently open information and animation state are preserved locally across a remote refresh.
- While typing into non-command inputs, local skill input is retained to avoid a polling redraw wiping a partially entered value.

An empty incoming pilot/loadout/missing heat value does not automatically erase nonempty local state for a writable owned unit (or a host's unowned unit). The client preserves and re-sends the nonempty value, with a sync-guard notice. Explicit resynchronization requests a fresh table snapshot, but this nonempty-local guard still applies; it is not a guaranteed force-clear of those fields. This recovery behavior also means a rebuild needs a clear distinction between a legitimate deliberate empty value and an incomplete/stale snapshot.

#### Delivery, retries and status

Typical poll delay after completion is 450 ms while visible and online, 4 seconds in a hidden browser, or 1.5 seconds when stuck. Offline failures use exponential backoff beginning around 900 ms and capped at 15 seconds. Local mutations normally batch after roughly 220 ms. Rejected-token or ended-table states stop ordinary retry and request re-authentication. The client exposes link status, pending queues and last error so uncertain/unsent state is visible.

Queued hits/events are retained across conflicts rather than discarded. Oversized/invalid pushes are reported and backed off; old undo/import metadata can be trimmed as a recovery measure. This is in-memory delivery resilience, not a durable offline transaction queue surviving arbitrary browser/process termination.

### Undo in shared play

Ordinary local actions store an undo snapshot/label; the bridge augments entries with event identity and author. Incoming damage is transmitted as a delta with the associated undo entry. Shared undo emits additive inverse impacts and removes the exact targeted undo ID, preserving independent later hits from other seats. Whole-telemetry replacement is used where necessary for changes that are not representable as HP/plating deltas, and only writable owners/host may send such state replacements.

The host or unit owner can undo the unit's actions. A non-owner can reverse an action only if it authored that action; the current undo operation acts on the current top entry, and refuses another author's top action. There is no general arbitrary event-history rewind operation. Retry deduplication prevents the same inverse impact from landing repeatedly.

### Editing a live frame without immediately publishing it

The live-frame edit operation saves a bench snapshot of encounter sheets/current unit, temporarily exits active sheet sync, and opens the current/owned unit in the local standard-EP builder. Its encounter revision is intentionally frozen while editing. Presence and chat remain connected independently.

Returning offers a choice to import the edited frame into the live encounter or discard its changes. The client restores the bench first, then replaces an owned unit (or the host's selected unit); if needed it creates an owned unit. Normal synchronization then reconciles against table changes that happened during editing. Other clients' table changes are not supposed to be overwritten by the mere act of opening a builder. Host editing is not automatically the unlimited-EP Overseer mode.

### Persistence and saved files

#### Server database

With a configured nonblank `DATABASE_URL`, the runtime uses PostgreSQL through a connection pool (the code calls this backend “neon”, but its driver is ordinary `pg`). Without it, the application creates an embedded PGLite database **in memory**, shared across hot module reloads within one process. A full server restart destroys the fallback table, seats, state and colors. Database migrations create room/member tables and the persistent seat-color field. Presence-area strings are always process-local even with persistent PostgreSQL.

With persistent database storage, table snapshots, member IDs/tokens/roles/callsigns, colors and bounded event history survive application restart. Browser identity and color backups do not constitute a backup of encounter state.

#### Browser-local state

Browser storage remembers username, seat capability, selected name color per callsign, theme/audio and section/targeter display preferences. It does not provide a durable multi-device account or a full automatic save of every solo encounter. Private mode/storage failures are handled as best effort, but remembering/reconnecting may be unavailable.

#### Single-unit manifests

A frame manifest is human-readable text containing version, designation, chassis/core/equipment and an encoded flight-recorder payload for operational state. Single-unit import/export is handled by the terminal engine; preserve its schema separately from table-seat metadata. Per-unit export does not recreate a table's secret tokens, presence or shared log.

#### Encounter backup/export

The host can export all current sheets into a `FORGE ENCOUNTER` text file, composed of named manifest sections and a `CLOSED` suffix for closed entries. It includes the currently held/hidden sheets because it iterates the host's sheet list. On encounter import, existing live units are marked for deletion and replaced by the imported sections. Imported sections receive new identities, preserve their section display name/closed marker, become visible (`hidden=false`), and are unassigned (`ownerId=null`). Thus the file is a unit-state backup, **not an exact restore of seat assignments, holding-bay visibility, table log, member colors or capabilities**.

Catalogue export is a separate standalone HTML package with embedded catalogue data and its client application; it is not an encounter or multiplayer database backup.

### Capacity and protocol constraints useful for a rebuild

These are implementation limits, not campaign mechanics:

- 8 total seats per table, host included. At capacity, non-host seats offline over 30 minutes and owning no unit may be reclaimed; owning seats and host are retained.
- Server sheet IDs: 8–80 alphanumeric/underscore/hyphen characters; member IDs/tokens have restricted hex forms. Client-generated IDs are random 8-byte hex; seat capabilities are random 24-byte hex.
- Most sheet display/prospective-owner names: 28 characters; callsigns: 16; chat: 500.
- Shared roll records: 200; one response delivers at most 80 incremental eligible records; client initial catch-up renders at most 30.
- Per-sheet undo payload: up to 40 entries; remembered recent impact IDs: 400.
- Per push: at most 16 impacts, 12 ordinary-state replacements, 12 telemetry states, 24 metadata/color/order entries, 8 upserts/deletions and 10 log lines. The client normally batches fewer (12 impacts and 8 log lines).
- Structured roll details: at most 40 strings of 300 characters; attack label 160, result 80, frame label 80.
- Whole push JSON is checked against roughly 1.5 million characters after JSON parsing/schema validation. Individual unit/rest/telemetry blobs also have size checks (roughly 500k/450k/200k). These are not a substitute for pre-parse request-body limits.
- The normal client uses one default table. Legacy server operations also support randomly generated five-character room codes and explicit join/end; do not infer a polished multi-campaign lobby from that unused API capability.

### Rebuild requirements / explicit non-features

A replacement application can preserve these core behaviors without reproducing tabs, context menus, command prompts, animations or colors: distinct work profiles; independent frame entities; host/player/owner permissions; saved identity and authorized renaming; visible versus held units; live presence; shared incoming damage and event-specific undo; structured roll/event records with actor versus owner attribution; conflict-safe shared state; local unpublished editing; manifest and encounter backup boundaries.

Do not assume the existing product has authenticated multi-user accounts, secure offline identity recovery, automatic host succession, authoritative server dice/combat validation, a durable browser offline queue, unlimited history, exact encounter metadata restoration, server-backed catalogue editing/versioning, or fully private opponent sheets. Those require deliberate new designs.

## 7. Automation coverage and functional boundaries

### What changes state automatically

“Automatically” below means a consequence of a valid requested operation, not autonomous time progression.

| Trigger | Automatic consequence |
|---|---|
| Install a supported core or armor modifier | Recalculate the supported derived chassis values. |
| Spend ammunition on a valid attack | Reduce loaded rounds before success/failure is known. |
| Resolve an attack | Replace that weapon's pending hit/miss state. |
| Resolve normal outgoing damage | Consume pending hits and append/update result data. |
| Apply incoming impact | Calculate DR/penetration/plating, alter one component HP pool, and possibly create a pending stability check. |
| Cross a heat threshold | Change frame armor, Dodge and displayed movement bonuses. |
| Use a valid check's Heat toggle | Clear that toggle and add up to one heat. |
| Cross a relevant component threshold | Change component state, enforce implemented station/housing interlocks, and update summaries. |
| Cross the Brittle threshold | Apply the signed Stability adjustment. |
| Complete a valid active-defense roll | Clear Retreat. |
| Receive a canonical username change | Preserve the same member identity and update remembered username state. |
| Receive remote changes | Merge authorized state, additive impacts and events according to the table rules. |

### Important descriptive systems that remain manual

The catalogue is richer than the automatic rules engine. A rebuild must not assume every token is executable. Current examples include:

| Data/description | Current automation boundary |
|---|---|
| `HEAT:+N/shot`, per-burst or per-turn costs | No universal automatic weapon/device heat-cost interpreter. Explicit Heat toggles and manual adjustments are separate. |
| Cooldowns, charge turns, Ready maneuvers, deployment and recovery | No turn scheduler or action-economy enforcement. |
| ECM radius, sensor bonuses/contests, suppression of opposing accuracy | Stored/described, with no general spatial or opposing-system rules engine. Core targeting `ACC-...` tokens are a separate supported mechanic. |
| Shield interception or successful Block | A result does not automatically move the receiving hit onto the shield. |
| Countermeasure pods, mirage fields, deflector redline collapse | No generic automatic defense-effect activation/negation system. |
| Redundant actuators and special limb penalties | Described equipment benefits do not automatically replace the generic component/override rules. |
| Remote-bits restrictions and special rear/gap interaction | Their prose does not automatically enforce target restrictions or loss conditions. |
| Nanite menders and custom repair percentages | No automatic device-specific replacement for generic field repair. |
| Utility movement boosts, anchors and conditional HND/SR/ACC | Generally descriptive; ordinary equipment enters derived chassis aggregation only through the percent-DR selection quirk. |
| Crew, cargo, mass, FP, fuel/burn counts and logistics | Descriptive data without a general budget, depletion, casualty or replenishment engine. |
| Weapon critical-failure destruction and special stability triggers | Not automatically executed by generic attack classification or damage resolution. |
| Radiation | Dormant stored/helper support; no current ordinary exposed tracker or dose automation. |

### Explicit current non-features

The current program has no automated initiative order, round/turn progression, action-point ledger, positional map/grid, pathfinding, facing geometry, line of sight, measured target acquisition, full opposed attack/defense transaction, automatic outgoing-to-incoming damage transfer, damage-type wounding engine, critical-result table engine, general condition/status-effect framework, human-character point/advantage/XP progression, or comprehensive human inventory/encumbrance system.

It also has no authenticated account system for table seats, secure offline callsign recovery, automatic host succession, server-authoritative dice/rules validation, durable browser transaction queue, unlimited event history, exact seat/visibility restoration from encounter text, or central live-synchronized catalogue authoring service.

### Discrepancies to decide deliberately in a rebuild

These are observed baseline issues, not proposed new game rules:

| Area | Current behavior requiring a deliberate choice |
|---|---|
| Shield paired DR | `DR:A/B` uses B under the default shield lookup, despite the adjacent first-value mapping comment. |
| Rapid Strike | Uses one attack roll with effective melee RoF/hit cap2, rather than generating two independent attack checks. |
| Short magazine burst | Hit count is capped by rounds actually fired, but requested/clamped RoF can still grant the larger attack-skill bonus. |
| LOST unit | Overall LOST does not globally prevent an otherwise usable weapon or skill from operating. |
| Destroyed limb repair | Generic field repair can repeatedly recover a limb from negative maximum HP. |
| Heat at zero/full capacity | +2 Heat roll flags still work and clear; the pool may be unable to accept the corresponding heat point. |
| Failure degrees | Most generic checks divide failure margin by SR; attack/parry and Block use different handling. |
| Equipment aggregation | A percent-DR token brings the entire item stat block into general chassis aggregation; other ordinary items are mostly excluded. |
| Catalogue TL0 | Accepted in authoring, but rebuilding exported catalogue data changes it to TL8. |
| `VALID` and checksums | Minimal structural markers and weak checksums do not prove legal construction or authenticity. |
| Imported unknown traits | Base manifest text does not encode every installed trait, so unknown records can lose two-handed/shoulder-fireable behavior. |
| Opponent “read only” | Most edits are blocked, but additive incoming damage and authorized undo are intentionally open; entrypoints differ. |
| Player sheet label/order | Client offers these operations, but host-only server metadata/order processing prevents reliable shared persistence. |
| Identity recovery | Offline callsign possession alone can recover the associated seat/role, including host. |
| Encounter backup | Unit manifests restore useful state but not original visibility, seat assignments, member capabilities or event history. |
| Item/component identity | Several operations use index/name/station and order-aligned arrays rather than permanent instance/component IDs. |

A new interface should expose these decisions honestly. Matching a descriptive equipment note is not feature parity unless the current program actually executes it; correcting a discrepancy should be documented as a change from the baseline.

## 8. Rebuild behavior examples

These examples can become acceptance tests. “Baseline” means the audited current behavior, including quirks.

| Scenario | Baseline expected result |
|---|---|
| Modular Medium Frame, Standard Fusion Core, Standard Thrusters, Standard Fire Control | 225 HP, MOVE11L/23S, HND+2, SR2, EP capacity 10. |
| Install a second identical armament | Allowed if capacity permits. |
| Install another non-armament item with the same exact name | Refused, including a different tier of that named non-armament item. |
| Add an item that exceeds normal EP capacity | Refused by ordinary installation; unlimited-capacity mode permits the budget excess. |
| Compile a frame with no installed A/D/U item | Refused; selected cores alone do not satisfy the minimum compile condition. |
| Import an over-budget or alternate-stat manifest | Recover its exported values with an audit rather than silently replacing them with current catalogue values. |
| Base HP165 mech with no shields | Head/Core/Cabin each165; Utility and each limb83. Each is an independent pool. |
| SMALL SHIELD `DR:160/60 HP:40` | 40 maximum HP and, under the current quirk, DR60. |
| Frame DR650, divisor2, both Rear and Gap, raw damage200 | Effective DR81.25; penetration119 after ceiling. |
| Frame DR650 at Heat 5/10 | Frame DR488; Dodge+1 and movement+1. Shield DR is unchanged. |
| Heated DR488, damage500, divisor2, Rear+Gap, eligible custom 50% plate | Effective DR61, raw penetration439, final damage220, one plate charge spent. |
| Ordinary damage on an 83-HP arm | HP can fall to-83, and no lower through ordinary application. A non-limb stops at0. |
| Field-repair the83-HP arm from-83 | Add42, producing-41; repeated repairs can eventually restore it. |
| Penetrating damage exactly half a component's maximum | Does not create the generic stability check. Strictly greater than half does. |
| Failed stability roll | Reports a result and clears a valid attempted pending check; no automatic prone/knockdown condition is created. |
| Brittle Core at exactly half HP | Brittle adjustment inactive; strictly below half activates it. |
| Missing base skill | Reject the roll; do not substitute an assumed skill or spend attack ammunition. |
| Piloting14, HND+2, no other modifiers | Dodge9; ordinary Piloting14. There is no separate base+3 Dodge. |
| Effective skill15 with roll5 | Critical success. Critical status alone does not add a critical-table consequence. |
| Effective skill16+ with roll17 | Failure, ordinarily noncritical unless the separate critical-failure condition applies. |
| Successful attack by 4 with RCL2 and three actual rounds fired | Three pending hits: `min(3,1+floor(4/2))`. |
| RoF 5 requested with only one loaded round | Spend one round and allow at most one hit, while retaining the current +2 requested-RoF bonus. |
| Last shot empties a magazine | Its already-recorded damage remains resolvable. A new attack is unavailable until rounds exist. |
| Consume a recorded hit queue, then request normal damage again | Refuse duplicate resolution. A separately forced damage action is an explicit exception. |
| Reload a partial magazine with a spare | Consume one spare and replace with a full magazine; no reload countdown advances. |
| Valid Retreat defense attempt fails | Retreat still clears. A rejected attempt with no base skill leaves Retreat set. |
| VENT 2, success margin3 | Remove5 heat, limited by current heat; a used skill Heat toggle subsequently adds one heat back. |
| Rename a pilot while it owns a unit | Preserve member ID, role, token and unit ownership; reconnect uses the server's canonical name. |
| Player tries renaming another player | Server rejects the operation. |
| Two concurrent joins/renames request the same username | Case-insensitive collision protection permits only one claim. |
| Host hides a unit in the holding bay | Other players do not receive that unit or its unit-bound events. Closing a visible unit does not have this concealment effect. |
| Two people apply separate valid impacts | Additive impact handling preserves both rather than replacing one with the other. |
| Retry the same accepted impact/event | Deduplication prevents it being applied twice. |
| Chat while editing a live frame locally | Chat continues; local builder state is not automatically published into the live table. |
| Restart the default server without persistent storage | In-memory table data is lost; saved browser username/token does not restore the encounter. |
| Import a host encounter text backup | Replace units with imported states and new IDs; original seat ownership and holding-bay state are not restored. |

These examples should be extended with the chosen fixes to section7's discrepancies. For faithful migration, keep a baseline test and a separately documented changed expectation rather than quietly blending the two.

## 9. Legacy state and data contracts

### Preserve data meaning independently of interface

A useful domain separation for a rebuild is:

| State group | Current contents | Lifetime / caveat |
|---|---|---|
| Definition library | Catalogue records and tier definitions | Local document/library; explicit package export persists/distributes edits. |
| Design | Chassis, selected systems, installed record copies, designation | Portable through manifests, subject to trait/compatibility limitations. |
| Per-unit operating state | Component HP/overrides/plating, heat, pilot inputs, targeter profiles, pending hits, recent results, undo and pending stability | Full live/local state is broader than the compact recorder. |
| Shared unit metadata | Unit UID, display label, order, color index, owner, closed and holding-bay flags | Server snapshot; encounter text does not exactly restore all metadata. |
| Member identity | Stable member ID, capability, canonical username, role and chosen color | Server plus browser cache; not authenticated personal accounts. |
| Session/local working context | Active unit/weapon, damage-entry values, unpublished edit bench and partially entered values | Not a campaign rule or guaranteed durable backup. |
| Event stream | Stored acting-seat ID/callsign, unit UID/label, sequence, result/chat data and dedupe identity | Displayed roll ownership is resolved separately; server history and catch-up windows are bounded. |

### Existing catalogue record keys

The companion [catalogue snapshot](FORGE-OS-5.5.3-catalogue-snapshot.json) preserves the existing field names so the content can be migrated without scraping this document.

| Key | Meaning |
|---|---|
| `c` | Category code A/D/U/F/R/T/G. |
| `n` | Definition name; exact name remains a current lookup/duplicate key. |
| `e` | Signed integer equipment cost or frame/core capacity contribution. |
| `s` | Space-separated stat-token string. |
| `t` | Group/subtype and model/class text joined with ` // `. |
| `w` | Descriptive mass text. |
| `xl`, `x` | Custom field label and value. |
| `r`, `f` | Tactical role text and notes/flavor text. |
| `th`, `sd` | Two-handed and shoulder-fireable flags. |
| `tl`, `exp` | Tech level and experimental flag. |

Each tier-array entry has the legacy order `[EP, stats, mass, custom-field value, notes]`. The JSON also provides this field order explicitly. The entries are definition data, not activation state or proof that their prose effects are automated.

Installed copies add instance state such as station, hardpoint, current rounds and spare magazines. A future data model can use different names and stable IDs, provided migration preserves those distinctions and deliberately handles unknown/alternate records.

### Numeric and identity conventions

HP maxima, spent charges, ammo and ordinary heat are integer domains. Incoming raw damage/divisor may be fractional, with the ceiling/rounding sequence specified earlier. Skill inputs distinguish blank from numeric zero. JavaScript `Math.round`, floor, ceiling, exact token matching and array order are observable parts of the legacy behavior.

Catalogue names and many token consumers are case-sensitive; normalized weapon-family keys are a different comparison domain. Usernames collide case-insensitively. Unit UIDs, member IDs, designation strings, sheet labels and prospective owner names are distinct identifiers with different limits.

Opaque user data that is not a recognized executable token should remain data. The legacy parser often preserves it for display/export; it does not make it executable rules code.

## Appendix A: stock catalogue

A Chromium initialization probe confirmed that the initial `DB` is exactly `rebuildDB(RAW)` in this release; there is no post-load range rescaling or universal ammunition injection. The historical changelog is not the current dataset. The 20mm LIGHT AUTOCANNON, for example, really retains `RNG:1800/7200` and no `AMMO:` token, despite its descriptive field mentioning a 600-round belt. It therefore does not deplete ammunition automatically.

There are **74 base definitions**: 19 armaments, 12 defensive systems, 12 utilities, 15 frames (5 modular knights, 3 General mechs, 7 vehicles), 5 reactors, 5 thrusters, and 6 targeting systems. Four named records have separate variant sets, totaling 11 variants.

### Armament

- 20mm LIGHT AUTOCANNON — EP 2; `ROF:10 DMG:6dx4(3) AVG:84(840) ACC:6 RCL:1 RNG:1800/7200`.
- 30mm AUTOCANNON — EP 3; `ROF:5 DMG:6dx9(3) AVG:189(945) ACC:4 RCL:2 RNG:113/458 AMMO:15(1)`.
- HAILSTORM 40mm ROTARY CANNON — EP 4; `ROF:5 DMG:6dx11(3) AVG:231(1155) ACC:3 RCL:3 RNG:128/498 AMMO:15(2) SPARE:1 HEAT:+2/burst` (two-handed).
- 45mm HAND CANNON* — EP 3; `ROF:3 DMG:9dx9(3) AVG:283.5(850.5) ACC:4 RCL:3 RNG:135/518 AMMO:9(1)`.
- BREACHER SCATTERGUN — EP 3; `ROF:6 DMG:6dx6(3) AVG:126(756) ACC:2 RCL:1 RNG:75/250 AMMO:4(1) SPARE:1 NOTE:6_slugs_per_shot_counted_as_ROF NOTE:best_vs_REAR`.
- 90mm HEAVY RIFLE — EP 5; `ROF:1 DMG:9dx15(3) AVG:472.5 ACC:4 RCL:4 RNG:150/500 AMMO:3(1)` (two-handed).
- 60mm MISSILE POD — EP 2; `ROF:8 DMG:4dx12(4) AVG:168(1344) ACC:6 RCL:4 RNG:75/375 AMMO:8(1) SPARE:0 NOTE:+2_Active_Defense_vs_missiles` (shoulder-fireable).
- 60mm RIPPLE ROCKET BATTERY — EP 3; `ROF:6 DMG:4dx12(4) AVG:168(1008) ACC:5 RCL:4 RNG:75/375 AMMO:12(2) SPARE:0 NOTE:+2_Active_Defense_vs_missiles NOTE:fires_two_6-rocket_salvos`.
- 80mm ROCKET LAUNCHER — EP 3; `ROF:2 DMG:5dx18(4) AVG:315(630) ACC:5 RCL:5 RNG:100/450 AMMO:2(1)`.
- 120mm ROCKET CANNON — EP 5; `ROF:1 DMG:6dx30(4) AVG:630 ACC:5 RCL:6 RNG:150/750 AMMO:1(1) SPARE:4` (two-handed).
- VIBROBLADE (LIGHT) — EP 1; `ROF:X DMG:64d(3) AVG:224`.
- VIBROBLADE (MEDIUM) — EP 2; `ROF:X DMG:76d(3) AVG:266`.
- VIBROBLADE (HEAVY) — EP 3; `ROF:X DMG:88d(3) AVG:308` (two-handed).
- PILE BUNKER — EP 4; `ROF:X DMG:10dx15(4) AVG:525 AMMO:1(1) SPARE:4 NOTE:charge_one_turn_before_firing_1_heat_cost_one_cartridge_reload_after_each_shot`.
- SKYFALL CAPACITOR RAILGUN — EP 5; `ROF:1 DMG:6dx25(4) AVG:525 ACC:5 RCL:3 RNG:250/900 AMMO:3(1) HEAT:+4/shot NOTE:capacitor_recharge_cannot_fire_on_consecutive_turns NOTE:crit_fail_on_attack_roll_destroys_weapon NOTE:20+_penetrating_to_mounting_arm_disables_it` (two-handed).
- IMPACT MAUL — EP 4; `ROF:X DMG:94d(3) AVG:329 NOTE:any_penetrating_hit_forces_the_target_to_make_a_Stability_check` (two-handed).
- SALVAGED LASER CARBINE — EP 3; `ROF:3 DMG:6dx10(4) AVG:210(630) ACC:6 RCL:1 RNG:150/500 HEAT:+1/shot NOTE:no_ammo`.
- KAGEROU BEAM TACHI — EP 1; `ROF:X DMG:84d(6) AVG:294`.
- KAGEBOSHI REMOTE BITS — EP 1; `ROF:4 DMG:6dx6(4) AVG:126(504) ACC:4 RCL:1 RNG:100/400 AMMO:16(2) SPARE:0 HEAT:+1/turn_used REAR:apply_the_REAR_flag NOTE:firing_the_bits_is_the_attack_for_that_turn NOTE:cannot_combine_with_GAP NOTE:ECM_SUITE_tier_2+_in_radius_grounds_the_bits NOTE:lost_when_the_Utility_location_is_disabled` (shoulder-fireable).

### Defensive systems

- SMALL SHIELD — EP 2; `DR:160/60 HP:40`.
- MEDIUM SHIELD — EP 3; `DR:180/90 HP:160`.
- LARGE SHIELD — EP 5; `DR:200/120 HP:300`.
- TOWER SHIELD — EP 7; `DR:240/180 HP:500`.
- REINFORCED ARMOR — EP 3; `DR:+10% NOTE:does_not_stack_with_other_percent_armor`.
- SPACED ARMOR PANELS — EP 2; `EFFECT:+1_armor_divisor_step_vs_shaped_charge/rockets NOTE:no_effect_vs_kinetic_or_beam`.
- SACRIFICIAL PLATING — EP 4; `PLATE:25 PLATE-USES:1 PLATE-HP:full NOTE:ablative_tiles_one_use_per_component`.
- COUNTERMEASURE POD — EP 2; `EFFECT:1/round_negate_attacker_ACC_bonuses NOTE:base_skill_unaffected`.
- REDUNDANT ACTUATOR HARNESS — EP 3; `EFFECT:first_crippling_hit_per_limb_leaves_it_working NOTE:arm_-2_to_hit_with_its_weapons_and_melee NOTE:leg_-2_Piloting_and_half_MOVE NOTE:next_damaging_hit_to_that_limb_cripples_normally NOTE:no_effect_on_head_or_torso_or_destruction`.
- KITSUNE MIRAGE FIELD — EP 2; `EFFECT:enemy_ranged_attacks_-2 HEAT:+1/turn_active NOTE:SENSOR_SUITE_tier_2_halves_to_-1_tier_3_negates NOTE:no_effect_in_melee NOTE:drops_for_1_turn_after_any_hit_of_100+_penetrating`.
- HAKKEI DEFLECTOR SHIELD — EP 2; `DR:350 HP:250 HEAT:+2/Block NOTE:hand-held_emitter_held_like_any_shield NOTE:collapses_while_HEAT_is_in_redline`.
- LACQUERED O-YOROI PLATING — EP 2; `DR:+15% NOTE:does_not_stack_with_other_percent_armor LOGISTICS:without_Reman_lacquer_between_sorties_drops_to_+5%`.

### Utility

- FOOT ROLLERS — EP 1; `MOVE:+50%_land_on_flat/paved NOTE:-1_SR_on_rough NOTE:not_while_prone`.
- ROCKET BOOSTERS — EP 2; `MOVE:+50%_for_1_turn NOTE:ignore_terrain COST:1_FP/turn_or_heat DEF:-1_next_defense`.
- JUMP JETS (SHORT) — EP 2; `JUMP:up_to_1/2_MOVE NOTE:Piloting_roll_to_land_cleanly`.
- ENHANCED TARGETING SUITE — EP 2; `ACC:+2_ranged NOTE:lost_if_head_or_sensors_disabled`.
- FIRE CONTROL LINK — EP 1; `EFFECT:ignore_ROF_recoil_penalties_up_to_RCL_2 NOTE:one_weapon_per_turn`.
- STABILITY GYROS — EP 1; `SR:+1_firing_heavy_or_sustained_weapons`.
- ECM SUITE — EP 2; `TIERS:3 RADIUS:50/250/500m DETECT:-4/-8/-12 EFFECT:suppresses_sensor-based_ACC_bonuses`.
- SENSOR SUITE — EP 3; `TIERS:3 RADIUS:250/500/750m CHECKS:+2/+4/+6 EFFECT:half_sensor_ACC_vs_ECM NOTE:full_if_higher_tier_than_ECM`.
- ICARUS OVERDRIVE WINGS — EP 3; `MOVE:+100%_1_turn_per_burn HND:+1_while_active HEAT:+4/activation DEF:-1_active_defenses_that_turn HP:20 NOTE:ground_frames_powered_leap_lands_end_of_turn NOTE:air_frames_boosts_existing_air_MOVE_only NOTE:any_penetrating_rear_hit_destroys_wings NOTE:lost_mid-leap/flight_Piloting-2_or_crash_land NOTE:percent_MOVE_bonuses_add_not_multiply`.
- BASTION SIEGE ANCHOR — EP 2; `SR:+2_while_anchored ACC:+1_ranged_while_anchored EFFECT:-1_RCL_all_weapons_while_anchored NOTE:deploy_and_retract_are_each_a_Ready_maneuver_no_attack NOTE:MOVE:0_and_Dodge_-2_while_anchored NOTE:mechs_and_tanks_only NOTE:stacks_with_targeting_suites`.
- SHUKUCHI FLASH-STEP — EP 2; `DEF:+3_to_one_Dodge_per_turn_declared_before_rolling HEAT:+4/use NOTE:no_effect_vs_area_or_salvo_attacks`.
- TSUKUROI NANITE MENDER — EP 2; `REPAIR:10%_of_location_max_HP EFFECT:Ready_restores_HP_to_one_location_self_or_adjacent_ally_no_roll HEAT:+2/use NOTE:cannot_restore_a_disabled_location`.

### Reactors

- LIGHT FISSION CELL — EP 2; `ST/HP:+30% HEAT:7 VENT:1 HND:+1 SR:-1`.
- STANDARD FUSION CORE — EP 3; `ST/HP:+50% HEAT:10 VENT:2`.
- HEAVY FUSION CORE — EP 5; `ST/HP:+70% HEAT:12 VENT:3 HND:-1 SR:+1`.
- OLEUM VIS CORE — EP 4; `ST/HP:+60% HEAT:12 VENT:2 RAD:25/sortie NOTE:+10_rads/turn_ending_in_danger_zone_+25_in_redline NOTE:log_rads_on_pilot_sheet_(B435) NOTE:no_fuel_or_FP_costs_but_boosters_still_cost_heat NOTE:radiation_signature_+2_to_enemy_sensor/detection_checks`.
- TAMASHII RESONANCE CORE — EP 4; `ST/HP:+55% HEAT:11 VENT:1 SHUTDOWN:ECM_SUITE_tier_3_in_radius_raises_VENT_to_3 NOTE:High_Maintenance_-2_to_repair_rolls`.

### Thrusters

- LIGHTWEIGHT THRUSTERS — EP 1; `MOVE:+15% HND:+1 SR:-1`.
- STANDARD THRUSTERS — EP 2; `MOVE:+25%`.
- HEAVY THRUSTERS — EP 3; `MOVE:+40% HND:-1 SR:+1`.
- ICARUS AFTERBURNER STACK — EP 0; `MOVE:+60% HND:+1 SR:-1 HEAT:+1/turn_at_full_MOVE`.
- KAZE-NO-MAI VECTOR THRUSTERS — EP 2; `MOVE:+30% HND:+2 SR:-1 NOTE:High_Maintenance_-2_to_repair_rolls`.

### Targeting

- MANUAL SIGHTS — EP 1; `ACC-ALL:+0`.
- STANDARD FIRE CONTROL — EP 0; `ACC-ALL:+1`.
- AUTOTARGETER — EP 0; `SPEC:CLOSE-QUARTERS/SNIPER NOTE:choose_close-quarters_or_sniper_mode`.
- MULTI-ROLE TARGETING SUITE — EP -2; `ACC-ALL:+2`.
- LINKED FIRE CONTROL SUITE — EP -1; `SPEC:BALLISTIC/MISSILE/MELEE ACC-SPEC:+2 ACC-OTHERS:-1`.
- SHINGAN MIND'S-EYE SUITE — EP -2; `ACC-ALL:+2 EFFECT:ignores_ECM_SUITE_tier_1 NOTE:tier_2+_ECM_applies_normally`.

### Frames

| Frame | Family | Base EP | Base stats |
|---|---|---:|---|
| LIGHT FRAME | Knight | 3 | `ST/HP:125 DR:400/200 MOVE:11L/22S SM:+6 HND:+2 SR:1` |
| MEDIUM FRAME | Knight | 5 | `ST/HP:150 DR:500/250 MOVE:9L/18S SM:+6 HND:+2 SR:2` |
| HEAVY FRAME | Knight | 7 | `ST/HP:175 DR:700/350 MOVE:7L/14S SM:+7 HND:+1 SR:2` |
| LIGHT CHASSIS | General | 5 | `ST/HP:130 DR:360/180 MOVE:12L/23S SM:+6 HND:+3 SR:1 HEAT:9 VENT:2` |
| MEDIUM CHASSIS | General | 8 | `ST/HP:155 DR:450/225 MOVE:10L/20S SM:+6 HND:+2 SR:2 HEAT:9 VENT:2` |
| HEAVY CHASSIS | General | 12 | `ST/HP:185 DR:630/315 MOVE:8L/16S SM:+7 HND:+1 SR:3 HEAT:9 VENT:2` |
| TL8-TANK | Vehicle | 8 | `ST/HP:120 DR:300/180 MOVE:3L/- SM:+4 HND:+1 SR:4` |
| TL8-FIGHTER | Vehicle | 6 | `ST/HP:90 DR:200/120 MOVE:-/27S SM:+3 HND:+5 SR:1` |
| TL8-HELO | Vehicle | 6 | `ST/HP:80 DR:180/100 MOVE:4L/13S SM:+3 HND:+3 SR:2` |
| MUSHA-CLASS KNIGHT FRAME | Knight | 6 | `ST/HP:165 DR:650/325 MOVE:10L/20S SM:+6 HND:+2 SR:2 BRITTLE:-1_SR_below_half_HP NOTE:repairs_take_x2_time_without_Reman_crews_and_parts` |
| TL8-SIEGE CRAWLER | Vehicle | 10 | `ST/HP:160 DR:450/300 MOVE:2L/- SM:+5 HND:0 SR:5` |
| CASTELLAN SUPERHEAVY FRAME | Knight | 9 | `ST/HP:200 DR:800/400 MOVE:5L/10S SM:+7 HND:0 SR:3` |
| TL8-ARMORED CARRIER | Vehicle | 5 | `ST/HP:110 DR:280/160 MOVE:4L/- SM:+4 HND:+1 SR:3 CREW:driver_and_commander CARGO:6_infantry_or_2_downed_pilots` |
| TL8-TECHNICAL RAIDER | Vehicle | 5 | `ST/HP:65 DR:150/80 MOVE:8L/- SM:+3 HND:+3 SR:2 CREW:driver_and_gunner` |
| TL10-KAGO HOVER TANK | Vehicle | 9 | `ST/HP:140 DR:480/300 MOVE:6L/- SM:+4 HND:+2 SR:3 CREW:driver_gunner_commander NOTE:Locomotion_disabled_halves_MOVE_instead_of_stopping_it NOTE:High_Maintenance_-2_to_repair_rolls` |

### Tier variants

| Record | Variant | EP | Exact variant stats |
|---|---:|---:|---|
| ECM SUITE | 1 | 2 | `TIER:1 RADIUS:50m DETECT:-4 EFFECT:suppresses_sensor-based_ACC_bonuses` |
| ECM SUITE | 2 | 4 | `TIER:2 RADIUS:250m DETECT:-8 EFFECT:suppresses_sensor-based_ACC_bonuses` |
| ECM SUITE | 3 | 6 | `TIER:3 RADIUS:500m DETECT:-12 EFFECT:suppresses_sensor-based_ACC_bonuses` |
| SENSOR SUITE | 1 | 3 | `TIER:1 RADIUS:250m CHECKS:+2 EFFECT:half_sensor_ACC_vs_ECM NOTE:full_if_higher_tier_than_ECM` |
| SENSOR SUITE | 2 | 5 | `TIER:2 RADIUS:500m CHECKS:+4 EFFECT:half_sensor_ACC_vs_ECM NOTE:full_if_higher_tier_than_ECM` |
| SENSOR SUITE | 3 | 7 | `TIER:3 RADIUS:750m CHECKS:+6 EFFECT:half_sensor_ACC_vs_ECM NOTE:full_if_higher_tier_than_ECM` |
| AUTOTARGETER | 1 | 0 | `SPEC:CLOSE-QUARTERS ACC-CLOSE:+2 ACC-MEDIUM:-1 ACC-FAR:-2` |
| AUTOTARGETER | 2 | -2 | `SPEC:SNIPER ACC-FAR:+2 ACC-MEDIUM:-1 ACC-CLOSE:-2 HND:-1` |
| LINKED FIRE CONTROL SUITE | 1 | -1 | `SPEC:BALLISTIC ACC-BALLISTIC:+2 ACC-ROCKET_MISSILE:-1 ACC-MELEE:-1` |
| LINKED FIRE CONTROL SUITE | 2 | -1 | `SPEC:MISSILE ACC-ROCKET_MISSILE:+2 ACC-BALLISTIC:-1 ACC-MELEE:-1` |
| LINKED FIRE CONTROL SUITE | 3 | -1 | `SPEC:MELEE ACC-MELEE:+2 ACC-BALLISTIC:-1 ACC-ROCKET_MISSILE:-1` |

Tier persistence caveat: the exported catalogue HTML embeds complete current tier definitions, but a frame manifest carries only the chosen variant EP/stat copy. A catalogue change is not live-synchronized between users. The rebuild should distinguish a library definition, its variants, and the already-installed immutable/value-copied instance.

## Appendix B: source traceability

All application observations in this document refer to the source snapshot `08f0de7795d43b62e486fbdd0b4fe2194ff21586`. The document may have a later commit of its own; that does not change the audited runtime snapshot.

| Area | Primary source / evidence anchors |
|---|---|
| Local work profiles, construction, catalogue and manifests | [terminal.html](https://github.com/OrionNow/Forge-OS/blob/08f0de7795d43b62e486fbdd0b4fe2194ff21586/versions/v5.5.3/terminal.html): `freshState`, `login`, `cap`, `inst`, `cfgConfirm`, `statWith`, `coreStats`, `armStats`, `saveComponent`, `variant`, `txt`, `parseManifest`, `loadManifestFile`, `bbEnc`, `buildCatalogHTML`. |
| Components, damage and heat | Same source: `locs`, `maxOf`, `armorOf`, `cond`, `statKey`, `autoCalc`, `applyDmg`, `plate`, `repairComp`, `engHold`, `heatZone`, final `heatVent`, `stabRoll`, `brittleOn`, `frameStatus`. |
| Skills and combat | Same source, final effective definitions: `slOf`, `rngPen`, `rofBon`, `targetAimBonus`, `_isCrit`, `skillRoll`, `atkRoll`, `rollW`, `defCur`, `setMna`, `setRs`, `reloadW`, per-weapon targeting helpers. |
| Multiplayer client behavior | [mp-bridge.js](https://github.com/OrionNow/Forge-OS/blob/08f0de7795d43b62e486fbdd0b4fe2194ff21586/versions/v5.5.3/mp-bridge.js): `connectSeat`, `absorbIdentity`, `buildPush`, `applyRemote`, `merge3`, `drainRolls`, `mpEditor`, `mpSaveAll`, `mpLoadAll`, `mpRenameUser`, guarded action wrappers. |
| Authoritative permissions, limits and persistence writes | [room.server.ts](https://github.com/OrionNow/Forge-OS/blob/08f0de7795d43b62e486fbdd0b4fe2194ff21586/versions/v5.5.3/server/room.server.ts): request schemas, `canWrite`, `present`, `redact`, `mayUndo`, `applyPush`, `applyImpact`, `handleJoin`, `handleRename`, `handleRead`, `handlePush`, `envelope`. |
| Shared bindings | [forge-hook.js](https://github.com/OrionNow/Forge-OS/blob/08f0de7795d43b62e486fbdd0b4fe2194ff21586/versions/v5.5.3/forge-hook.js): exposes the terminal engine to the multiplayer bridge; not a second game-rule authority. |
| Database mode and migrations | [base db.ts](https://github.com/OrionNow/Forge-OS/blob/08f0de7795d43b62e486fbdd0b4fe2194ff21586/versions/v5.0-stable/src/lib/db.ts), [room migration](https://github.com/OrionNow/Forge-OS/blob/08f0de7795d43b62e486fbdd0b4fe2194ff21586/versions/v5.0-stable/migrations/0002_forge_rooms.sql), [member-color migration](https://github.com/OrionNow/Forge-OS/blob/08f0de7795d43b62e486fbdd0b4fe2194ff21586/versions/v5.5.3/migrations/0003_forge_member_colors.sql). |
| Representative regression coverage | [core checks](https://github.com/OrionNow/Forge-OS/blob/08f0de7795d43b62e486fbdd0b4fe2194ff21586/devtools/check-v553.cjs), [builder/export workflows](https://github.com/OrionNow/Forge-OS/blob/08f0de7795d43b62e486fbdd0b4fe2194ff21586/devtools/check-v553-workflows.cjs); source inspection remains necessary for branches not covered by those tests. |

Selected edge cases were executed in Chromium during this audit, including shield paired DR, LOST-frame interlocks, negative-HP limb repair, heated armor and combined plating, and the initial catalogue snapshot. Formula tables were checked against final executable definitions rather than historical patch descriptions.

This is an as-built functional audit, not a new penetration test, dependency remediation, balance certification or proof that every branch is bug-free.

## Appendix C: non-rule capabilities

These capabilities may be useful in a redesigned product, but do not determine combat outcomes:

- Search/filter catalogue records by name, class or token text; preserve group/category ordering.
- Search an encounter's unit labels and assigned-owner names without deleting or altering units.
- Retain detailed and concise event/result data, and filter routine system chatter while still retaining player chat.
- Maintain command history (up to 50 entries), operation completion and typo suggestions in the legacy command adapter. A different interface can expose the same operations without a command language.
- Remember theme/audio preferences and identity/unit color choices; preserve semantic condition and ownership information independently of color.
- Respect reduced-motion preferences. The current patched release has fixed compact density and terminal effects rather than an adjustable density/effects setting.
- Preserve entered skill values and caret/working input across remote refreshes so synchronization does not erase an in-progress edit.
- Provide import audits, rejection reasons, unsent/conflict/link status and provenance so users can distinguish local intentions from accepted shared state.

The legacy status/scan/targets/weapons/pilot commands expose current data and calculations. The recorder-verification operation computes its lightweight checksum. The legacy “ping” and idle technical heartbeat messages include fabricated/random latency and connection-flavor text; those are immersion features, not genuine network-performance measurements. A rebuild should distinguish actual network health from decorative telemetry.

The existing presentation's branding, crest, palettes, animation, text crawling, window geometry and input bindings are intentionally not prescribed by this functional specification.
