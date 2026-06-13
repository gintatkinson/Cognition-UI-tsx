# Feature 16: Rack-contained Chassis & Electricity Attributes Design Solution

This design solution implements slot-level chassis mapping and power/voltage constraint validations inside server racks.

## Proposed Architecture
- **Model Modifications**: Extend `EquipmentRack` and create `RackContainedChassis`.
- **Validation**:
  - `relativePosition` uniqueness constraint check.
  - Power budget calculation and validation check against `maxAllocatedPower`.
  - Referential integrity lookup using `MockNetworkInventoryService`.
- **UI Components**:
  - Max voltage & Max power inputs.
  - Dynamic U-slot mounting picker.
  - Visual Rack Elevation slot diagram displaying occupied slots and total utilization.

## BDD Scenarios

### Scenario 1: Detect chassis slot conflict
- **Given** a rack has a chassis at U-slot 10
- **When** we attempt to mount another chassis at U-slot 10
- **Then** validation fails with a slot uniqueness warning.

### Scenario 2: Validate max-allocated-power constraint
- **Given** a rack has a max-allocated-power of 2000 Watts
- **When** the total power of contained-chassis exceeds 2000 Watts
- **Then** validation fails with a power limit exceeded warning.
