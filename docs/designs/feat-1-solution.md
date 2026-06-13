# Solution Walkthrough - Feature 1: Geographic Reference Frame (Issue #1)

This document details the vertical slice implementation of Feature 1 (Geographic Reference Frame) targeting the Flutter platform.

## Implemented Changes

1. **Logic & Model Layer (`lib/models/geo_location.dart`)**
   - Implemented standard models for `GeoLocation`, `ReferenceFrame`, and `GeodeticSystem` mapping to RFC 9179.
   - Designed the `ReferenceFrameValidator` containing logic for:
     - Regex-based ASCII character checks (`[ -@\[-\^_-~]*`).
     - Value bounds validation (non-negativity for coordinate and height accuracies).
     - Precision bounds validation (ensuring decimal fraction digits do not exceed 6 places).
     - Case-insensitivity normalization.

2. **Mock Data Layer (`lib/services/mock_location_service.dart`)**
   - Built a singleton mock database service prepopulated with reference coordinates.
   - Provides hooks for inserting new records and retrieving all registered coordinates.

3. **UI & Presentation Layer (`lib/main.dart`)**
   - Created a Google Cloud & GKE Console styled dashboard.
   - Built a top navigation bar (featuring the "Google Cloud Platform" -> "GKE" -> "RFC 9179 Geo-Location Specs" GKE breadcrumb layout).
   - Designed a collapsible side-navigation drawer.
   - Integrated a dropdown theme selector supporting **Light Theme**, **Dark Theme**, and **System Theme** settings.
   - Developed dynamic text input controllers with live error validation indicators.
   - Embedded a toggle switch for simulating the `alternate-systems` YANG feature flag.
   - Added a clear/reset action and list registry representation using sleek, flat console cards.

4. **Testing Layer (`test/reference_frame_test.dart` & `test/widget_test.dart`)**
   - Implemented unit tests checking default values, normalization logic, and fraction precision limits.
   - Implemented widget smoke tests verifying app startup and header title matches.

---

## Verification Results

### Unit & Widget Test Coverage
All tests passed successfully:
```
00:00 +0: loading /home/parallels/Desktop/cogctl-ux-09/test/reference_frame_test.dart
00:00 +0: /home/parallels/Desktop/cogctl-ux-09/test/reference_frame_test.dart: Reference Frame Validation Logic Tests Default Astronomical Body and Geodetic Datum Normalization
00:00 +1: /home/parallels/Desktop/cogctl-ux-09/test/reference_frame_test.dart: Reference Frame Validation Logic Tests ASCII String Pattern Validation
00:00 +2: /home/parallels/Desktop/cogctl-ux-09/test/reference_frame_test.dart: Reference Frame Validation Logic Tests Coordinate/Height Accuracy Decimal Precision & Bounds Validation
00:00 +3: /home/parallels/Desktop/cogctl-ux-09/test/widget_test.dart: Dashboard launches and displays title smoke test
00:00 +4: All tests passed!
```

---

## Step-by-Step Human Manual Testing Instructions

To manually run and test the UI, execute the following steps:

1. **Launch the Application:**
   Run the Flutter desktop application or target Chrome:
   ```bash
   flutter run -d linux
   ```
   *(Or `flutter run -d chrome`)*

2. **Test Theme Selection (Light, Dark, and System settings):**
   - Click the theme dropdown (represented by the palette icon) in the top-right corner of the GKE Console header bar.
   - Select **Dark Theme**.
     - **Verification:** The interface switches immediately to Google Cloud's charcoal/dark gray theme (`#202124` background, dark cards with thin light borders).
   - Select **Light Theme**.
     - **Verification:** The interface switches immediately to Google Cloud's light theme (classic GCP blue app bar, `#F8F9FA` scaffold background, white cards with thin dark borders).
   - Select **System Theme**.
     - **Verification:** The application switches its theme automatically to match your OS brightness mode.

3. **Test Default Values:**
   - Leave the **Astronomical Body** and **Geodetic Datum** fields empty in the registration form.
   - Enter `0.01` in the **Coordinate Accuracy** field.
   - Click the **Register** button.
   - **Verification:** Inspect the "Registered Reference Frames" list card. A new card should appear with the astronomical body defaulted to **EARTH** and the datum defaulted to **wgs-84**.

4. **Test Character Set Validation (Regex Check):**
   - In the **Astronomical Body** field, enter emoji characters (e.g., `earth😀`) or special symbols (e.g., `©`).
   - Click the **Register** button.
   - **Verification:** An error message should immediately display below the input field stating: `"Invalid characters in astronomical body. Only standard ASCII without control chars allowed."`

5. **Test Decimal64 Precision Limit:**
   - Clear the form using the **Clear** button.
   - In the **Coordinate Accuracy** field, enter a decimal with 7 decimal places (e.g., `0.1234567`).
   - Click the **Register** button.
   - **Verification:** An error message should display below the input field stating: `"Accuracy cannot exceed 6 decimal places."`

6. **Test Non-negativity Range Limit:**
   - Clear the form.
   - In the **Height Accuracy** field, enter a negative decimal value (e.g., `-1.0`).
   - Click the **Register** button.
   - **Verification:** An error message should display below the input field stating: `"Must be a non-negative decimal."`
