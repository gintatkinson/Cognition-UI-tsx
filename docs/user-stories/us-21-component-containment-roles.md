---
title: "User Story 21: Component Containment & Roles (Issue #54)"
type: "user-story"
issue: 54
spec_source: "draft-ietf-ivy-network-inventory-yang Section 3"
---

# User Story: User Story 21: Component Containment & Roles (Issue #54)

## Domain Object Mapping
- **Primary Domain Objects:** `parent`, `parent-rel-pos`, `is-main`
- **Actor/Role:** Field Engineer / Deployment Automation Script

## BDD Scenario (OOA/OOD Realization)
**Given** the field engineer is inserting a module component into a chassis slot
**When** assigning the parent component reference, setting its slot number (relative position), and identifying the primary controller role
**Then** the system records the nested containment relation and checks that only valid chassis components are assigned the `is-main` role.

## Operational Context
> Devices have complex nested slots, sub-cards, modules, and fans. Modeling physical containment tree relationships helps visualize device layout.

## Required Features Matrix
- [x] #48 - [Feature 21: Component Containment & Roles](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/features/feat-21-component-containment-roles.md)

## Source References
YANG Schema: [ietf-network-inventory.yang](https://github.com/ietf-ivy-wg/network-inventory-yang/blob/main/yang/ietf-network-inventory.yang)
Normative Specification: [draft-ietf-ivy-network-inventory-yang](https://datatracker.ietf.org/doc/html/draft-ietf-ivy-network-inventory-yang)
