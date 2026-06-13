# Solution Walkthrough - Feature 18: Software & Manufacturer

This document outlines the design solution implemented for Feature 18: Software & Manufacturer.

## Covered YANG Schema Nodes
`["uuid", "name", "alias", "description", "mfg-name", "product-name", "software-rev", "patch"]`

## Implemented Changes

The following files were created/modified and verified:
- [lib/models/software_manufacturer.dart](file:///home/parallels/Desktop/cogctl-ux-09/lib/models/software_manufacturer.dart)
- [lib/services/mock_software_manufacturer_service.dart](file:///home/parallels/Desktop/cogctl-ux-09/lib/services/mock_software_manufacturer_service.dart)
- [lib/main.dart](file:///home/parallels/Desktop/cogctl-ux-09/lib/main.dart)
- [test/software_manufacturer_test.dart](file:///home/parallels/Desktop/cogctl-ux-09/test/software_manufacturer_test.dart)

### Implementation Details
* **Models**: Created `MockSoftwarePatch`, `MockSoftwareRevision`, and `MockSoftwareManufacturerConfig` to model the YANG common entity attributes hierarchical structure.
* **Services**: Created `MockSoftwareManufacturerService` which implements verification logic for UUID syntax, non-empty manufacturer fields, and software module name uniqueness.
* **UI Screen**: Created a dashboard containing metrics summary cards, a side-by-side split layout (for desktop), a form card for attribute configuration, and a pane listing active configurations with nested list of software revisions and patches.

## BDD Given-When-Then Acceptance Criteria
* **Scenario 1: Validate manufacturer name presence**
  * **Given** a software manufacturer configuration
  * **When** the `mfg-name` field is empty or null
  * **Then** the validation condition rejects the configuration.
* **Scenario 2: Validate UUID format constraint**
  * **Given** a software manufacturer configuration
  * **When** an invalid UUID format is entered
  * **Then** validation fails with an invalid UUID format error.
* **Scenario 3: Uniqueness of software module name**
  * **Given** a configuration has software revision "v1" configured
  * **When** another software revision with name "v1" is added
  * **Then** validation rejects the duplicate module name.

## Verification & Test Run Results

All automated unit and widget test suites covering this feature have passed successfully:
```bash
flutter test test/software_manufacturer_test.dart
```

## Step-by-Step Human Manual Verification Instructions

1. Start the application locally:
   ```bash
   flutter run
   ```
2. Open the sidebar navigation drawer and select **Software & Mfg**.
3. Select an active configuration from the list pane.
4. Try updating common attributes or adding software revisions/patches, verifying that validation warnings display appropriately for incorrect inputs.
