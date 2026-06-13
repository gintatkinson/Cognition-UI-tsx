# Solution Walkthrough - Feature 4: Motion Velocity Vector (Issue #4)

This document details the vertical slice implementation of Feature 4 (Motion Velocity Vector) targeting the Flutter platform.

## Implemented Changes

1. **Logic & Model Layer (`lib/models/geo_location.dart`)**
   - Created the `Velocity` model container representation.
   - Added validations for `v-north`, `v-east`, and `v-up` components:
     - **Decimal64 Bounds**: Validates values fit in the decimal64 range.
     - **Precision**: Enforces that fractional values do not exceed 12 decimal places.
   - Wired serialization and deserialization in the `GeoLocation` class, nesting the velocity components under a `'velocity'` JSON container key.

2. **Mock Data Layer (`lib/services/mock_location_service.dart`)**
   - Added orbital mock velocities to NTN satellites and DSN rovers.

3. **UI & Presentation Layer (`lib/main.dart`)**
   - Redesigned the theme color palette and elements to match the Google Cloud Console:
     - Classic Google Cloud primary blue (`#3367D6`), flat canvas background (`#F9F9F9`), and boxier 4px border radius.
   - Added form text inputs for **Northward Velocity (v-north)**, **Eastward Velocity (v-east)**, and **Upward Velocity (v-up)**.
   - Implemented dynamic live calculation of horizontal speed ($\sqrt{v_{\text{north}}^2 + v_{\text{east}}^2}$) and heading ($\text{atan2}(v_{\text{east}}, v_{\text{north}}) \times \frac{180}{\pi}$ normalized to $[0, 360)$).
   - Displayed active velocity vector details, horizontal speed, and heading inside registry cards.

4. **Testing Layer (`test/reference_frame_test.dart` and `test/widget_test.dart`)**
   - Added unit tests for velocity parsing, validation, and JSON serialization.
   - Added widget test verifying live dynamic calculation of speed and heading.

---

## Verification Results

All tests pass successfully.

---

## Step-by-Step Human Manual Testing Instructions

To verify the Motion Velocity Vector registration and live calculation flow, run the application:
```bash
flutter run -d linux
```

Then perform the following tests:

1. **Verify Google Cloud Console Styling:**
   - **Verification:** The interface displays flat gray cards with `#E0E0E0` borders, `#3367D6` blue accents/app bar, rectangular buttons with a flat `4px` border radius, and `#F9F9F9` canvas background.

2. **Test Live Speed and Heading Preview:**
   - In the **Motion Velocity Vector (Optional)** form section, enter `3.0` in the **Northward Velocity** field and `4.0` in the **Eastward Velocity** field.
   - **Verification:** A preview card immediately appears displaying: `"Live Computed Horizontal Speed: 5.00 m/s (18.00 km/h) | Heading: 53.13°"`.

3. **Test Decimal Precision Validation:**
   - Enter `1.1234567890123` (13 decimal places) in any velocity component.
   - **Verification:** Validation displays an error under the field: `"Velocity component precision cannot exceed 12 decimal places."`

4. **Test Registration & Active Listing:**
   - Clear the invalid value and submit the form with valid velocity coordinates.
   - **Verification:** A new card is added under the registry pane displaying the exact velocity values along with its calculated horizontal speed and heading.
