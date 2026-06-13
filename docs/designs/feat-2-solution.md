# Solution Walkthrough - Feature 2: Ellipsoidal Location Coordinates (Issue #2)

This document details the vertical slice implementation of Feature 2 (Ellipsoidal Location Coordinates) targeting the Flutter platform.

## Implemented Changes

1. **Logic & Model Layer (`lib/models/geo_location.dart`)**
   - Created the `LocationCoordinate` base abstract class.
   - Implemented `EllipsoidCoordinate` containing fields for `latitude`, `longitude`, and optional `height`.
   - Designed flat JSON serialization and deserialization matching the sibling-node layout of RFC 7951.
   - Added validation constraints to `ReferenceFrameValidator`:
     - **Latitude**: Must be between `-90.0` and `90.0`, with precision limited to 16 decimal places.
     - **Longitude**: Must be between `-180.0` and `180.0`, with precision limited to 16 decimal places.
     - **Height**: If present, precision is limited to 6 decimal places.
     - **Co-dependency**: `latitude` and `longitude` are co-dependent; one cannot be specified without the other.

2. **UI & Presentation Layer (`lib/main.dart`)**
   - Added `latitude`, `longitude`, and `height` input controllers.
   - Formatted inputs in a dedicated card for Coordinate registration.
   - Wired live validation highlighting.
   - Updated the console registry cards to display ellipsoidal coordinates (`LATITUDE`, `LONGITUDE`, `HEIGHT`).

3. **Testing Layer (`test/reference_frame_test.dart`)**
   - Added unit test cases for latitude/longitude bounds and precision checking.
   - Added unit test cases verifying correct RFC 7951 flat sibling JSON serialization.

---

## Verification Results

All tests pass successfully.

---

## Step-by-Step Human Manual Testing Instructions

To verify the ellipsoidal coordinate registration and validation flow, run the application:
```bash
flutter run -d linux
```

Then perform the following tests:

1. **Test Latitude and Longitude Co-dependency:**
   - Under the **Location Coordinates Choice** toggle, select **Ellipsoidal (Lat/Lon/H)**.
   - Enter `45.0` in the **Latitude** field, but leave **Longitude** empty.
   - Tap **SUBMIT REGISTER**.
   - **Verification:** An error message displays under the Longitude field: `"Longitude is required when latitude/height is specified."`
   - Enter `120.0` in the **Longitude** field, but clear **Latitude**.
   - Tap **SUBMIT REGISTER**.
   - **Verification:** An error message displays under the Latitude field: `"Latitude is required when longitude/height is specified."`

2. **Test Range and Bounds Validation:**
   - Enter `95.0` in the **Latitude** field and `120.0` in **Longitude**. Tap **SUBMIT REGISTER**.
   - **Verification:** Latitude field displays: `"Latitude must be between -90.0 and 90.0 degrees."`
   - Enter `45.0` in **Latitude** and `185.0` in **Longitude**. Tap **SUBMIT REGISTER**.
   - **Verification:** Longitude field displays: `"Longitude must be between -180.0 and 180.0 degrees."`

3. **Test Decimal Precision:**
   - Enter `45.12345678901234567` (17 decimal places) in the **Latitude** field.
   - **Verification:** Live validation displays: `"Latitude precision cannot exceed 16 decimal places."`
