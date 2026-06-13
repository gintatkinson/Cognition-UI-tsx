---
title: "Epic 1: Geographic Location (Issue #6)"
type: "epic"
issue: 6
labels: ["epic", "ietf-geo-location"]
---

# Epic: Epic 1: Geographic Location (Issue #6)

## 1. Context
This Epic covers the digital engineering reverse-engineering of RFC 9179 (Geographic Location). It defines a standard YANG grouping for specifying location data on or around astronomical bodies, supporting ellipsoidal coordinates, Cartesian coordinates, motion velocity vectors, and temporal validity constraints.

## 2. Requirements & Checklist
- [x] #1 - [Feature 1: Geographic Reference Frame](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/features/feat-01-reference-frame.md)
- [x] #2 - [Feature 2: Ellipsoidal Location Coordinates](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/features/feat-02-ellipsoid-location.md)
- [x] #3 - [Feature 3: Cartesian Location Coordinates](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/features/feat-03-cartesian-location.md)
- [x] #4 - [Feature 4: Motion Velocity Vector](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/features/feat-04-velocity-vector.md)
- [x] #5 - [Feature 5: Temporal Validity & Expiry](https://github.com/gintatkinson/cogctl-ux-09/blob/feat/1-reference-frame/docs/features/feat-05-temporal-validity.md)

## Associated Use Cases & User Stories

### Associated Use Cases
- [x] #12 - [Use Case 1: Register Geographic Location (Issue #12)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/use-cases/uc-01-register-geo-location.md)
- [x] #13 - [Use Case 2: Query Motion Coordinates & Velocity Trajectory (Issue #13)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/use-cases/uc-02-query-motion-coordinates.md)
- [x] #14 - [Use Case 3: Validate Expiry & Temporal State (Issue #14)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/use-cases/uc-03-validate-expiry.md)

### Associated User Stories
- [x] #7 - [User Story 1: WGS-84 Earth Location Compatibility (Issue #7)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-01-earth-wgs84.md)
- [x] #8 - [User Story 2: Lunar Location (Issue #8)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-02-lunar-location.md)
- [x] #9 - [User Story 3: Moving Object Velocity Telemetry (Issue #9)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-03-moving-object.md)
- [x] #10 - [User Story 4: Alternate System Reference Frame (Issue #10)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-04-alternate-system.md)
- [x] #11 - [User Story 5: Temporal Validity Expiry Check (Issue #11)](https://github.com/gintatkinson/cogctl-ux-09/blob/main/docs/user-stories/us-05-temporal-expiry.md)
## 3. Architecture and System Interaction Diagrams
```mermaid
classDiagram
    class GeoLocation {
        +referenceFrame
        +locationChoice
        +velocity
        +temporalValidity
    }
    class ReferenceFrame {
        +alternateSystem
        +astronomicalBody
        +geodeticSystem
    }
    class GeodeticSystem {
        +geodeticDatum
        +coordAccuracy
        +heightAccuracy
    }
    class LocationChoice {
        <<choice>>
        +ellipsoid
        +cartesian
    }
    class Ellipsoid {
        +latitude
        +longitude
        +height
    }
    class Cartesian {
        +x
        +y
        +z
    }
    class Velocity {
        +vNorth
        +vEast
        +vUp
    }
    GeoLocation --> ReferenceFrame
    ReferenceFrame --> GeodeticSystem
    GeoLocation --> LocationChoice
    LocationChoice --> Ellipsoid
    LocationChoice --> Cartesian
    GeoLocation --> Velocity
```

## 4. State Machine Definitions
```mermaid
stateDiagram-v2
    [*] --> Unconfigured
    Unconfigured --> Configured : Configure reference-frame
    Configured --> Active : Set location coordinates
    Active --> Expired : System time > valid-until
    Active --> Configured : Clear coordinates
    Expired --> Active : Update valid-until / coordinates
```

## 5. Specification Context
> This document defines a generic geographical location YANG grouping. The geographical location grouping is intended to be used in YANG data models for specifying a location on or in reference to Earth or any other astronomical object.

## 6. Source References
YANG Schema: [ietf-geo-location.yang](https://github.com/YangModels/yang/blob/main/standard/ietf/RFC/ietf-geo-location%402022-02-11.yang)
Normative Specification: [RFC 9179 Geographic Location](https://datatracker.ietf.org/doc/rfc9179/)
