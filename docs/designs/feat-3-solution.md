# Solution Walkthrough - Feature 3: Cartesian Location Coordinates (Issue #3)

This document details the vertical slice implementation of Feature 3 (Cartesian Location Coordinates) targeting the Flutter platform.

## Implemented Changes

1. **Logic & Model Layer (`lib/models/geo_location.dart`)**
   - Created the `CartesianCoordinate` concrete implementation extending `LocationCoordinate`.
   - Designed flat JSON serialization and deserialization matching the sibling-node layout of RFC 7951 for `x`, `y`, and `z` leaves.
   - Added validation constraints to `ReferenceFrameValidator`:
     - **Co-dependency**: X, Y, and Z coordinate coordinates are all mandatory in Cartesian mode.
     - **Precision**: Coordinates must not exceed 6 decimal places.

2. **UI & Presentation Layer (`lib/main.dart`)**
   - Implemented a segmented coordinate choice toggle: **Ellipsoidal** vs **Cartesian**.
   - Added form text inputs for **X**, **Y**, and **Z** coordinates, dynamically showing/hiding them based on the selected choice.
   - Wired live validation error indicators for each coordinate.
   - Updated the console active registry cards to display Cartesian axes (`X COORDINATE`, `Y COORDINATE`, `Z COORDINATE`) when Cartesian coordinate mode is selected.

3. **Testing Layer (`test/reference_frame_test.dart`)**
   - Created unit tests verifying Cartesian coordinate parsing, precision checks, and flat sibling JSON serialization.

---

## Verification Results

All tests pass successfully.

---

## Step-by-Step Human Manual Testing Instructions

To verify the Cartesian coordinate registration and validation flow, run the application:
```bash
flutter run -d linux
```

Then perform the following tests:

1. **Test Coordinate Input Toggle:**
   - Under the **Location Coordinates Choice** toggle, select **Cartesian (X/Y/Z)**.
   - **Verification:** The Latitude, Longitude, and Height input fields are hidden, and three input fields labelled **X Coordinate**, **Y Coordinate**, and **Z Coordinate** appear.

2. **Test Co-dependency & Required Fields:**
   - Leave the X, Y, and Z fields empty.
   - Tap **SUBMIT REGISTER**.
   - **Verification:** Error messages display under each coordinate field indicating they are required.

3. **Test Decimal Precision:**
   - Enter `6378137.1234567` (7 decimal places) in the **X Coordinate** field.
   - **Verification:** Live validation displays: `"X coordinate precision cannot exceed 6 decimal places."`
