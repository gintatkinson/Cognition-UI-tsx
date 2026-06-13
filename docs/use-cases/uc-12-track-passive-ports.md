---
title: "Use Case 12: Track Passive Port Mappings (Issue #72)"
type: "use-case"
issue: 72
spec_source: "draft-ygb-ivy-passive-network-inventory Section 3"
---

# Use Case: Use Case 12: Track Passive Port Mappings (Issue #72)

## OOA/OOD Realization
- **Primary Actor:** Network Operations Center (NOC) Operator / Automated Circuit Planner
- **Preconditions:** An ODF panel is mounted at a physical location.
- **Success Guarantee (Postconditions):** The specific input/output ports and fiber cores of the panel are retrieved.

## Main Success Scenario
1. The Actor searches for a passive device using its RFID tag or database ID.
2. The System retrieves the passive device entry.
3. The System displays the ODF ports list, showing port classifications (service, input, output) and core count.
4. The Actor identifies the target ports to map an end-to-end circuit.

## Extensions
- **2a. Device location-ref is empty:**
  - The System displays the asset details but warns that geographical location is not set.

## Required User Stories
- [ ] #70 - [User Story 25: Passive ODF and Splitter Inventory Registry](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-25-odf-splitter-inventory.md)

## Source References
YANG Schema: [ietf-nwi-passive-inventory.yang](https://github.com/aguoietf/draft-ygb-ivy-passive-network-inventory/blob/main/yang/ietf-nwi-passive-inventory.yang)
Normative Specification: [draft-ygb-ivy-passive-network-inventory](https://datatracker.ietf.org/doc/draft-ygb-ivy-passive-network-inventory/)
