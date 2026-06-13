# Solution Walkthrough - Feature 5: Temporal Validity & Expiry (Issue #5)

This document details the vertical slice implementation of Feature 5 (Temporal Validity & Expiry) targeting the Flutter platform.

## Implemented Changes

1. **Logic & Model Layer (`lib/models/geo_location.dart`)**
   - Added optional fields `timestamp` and `validUntil` of type `DateTime` to the `GeoLocation` class.
   - Implemented date-time validation in `ReferenceFrameValidator.parseDateTime`:
     - Ensures string input conforms to ISO 8601 format.
     - Enforces UTC timezone specification by validating that inputs end with `Z` or `+00:00`.
   - Added `ReferenceFrameValidator.validateTemporalValidity` chronological constraint check:
     - Enforces that `valid-until` must be strictly after the recorded `timestamp`.
   - Updated `GeoLocation` JSON serialization and parsing, mapping directly to RFC 7951 flat JSON sibling keys (`timestamp` and `valid-until`).

2. **Mock Data Layer (`lib/services/mock_location_service.dart`)**
   - Added realistic UTC timestamps and future/past expirations (valid-until dates) for various mock locations to test status badges and active list rendering.

3. **UI & Presentation Layer (`lib/main.dart`)**
   - Added form text input fields for **Recording Timestamp (ISO 8601 UTC)** and **Valid Until (Expiration, ISO 8601 UTC)** under a new **Temporal Validity (Optional)** form section.
   - Added a convenient **SET NOW** helper button to set the recording timestamp to the current system time in UTC ISO 8601 format.
   - Added relative offset helper buttons (**+1 Hour**, **+1 Day**, **+7 Days**) to easily set future expiration dates relative to the recording timestamp.
   - Implemented a dynamic expiration badge for each location card in the active listing:
     - Shows **ACTIVE** (green) if the valid-until date is in the future.
     - Shows **EXPIRED** (orange) if the valid-until date is in the past.
     - Shows **PERSISTENT** (grey) if no valid-until date is specified.
   - Implemented a 1-second periodic timer in the dashboard state to trigger widget rebuilds, ensuring that expiration badges update dynamically as the system clock advances.
   - Rendered a new **TEMPORAL VALIDITY** section in the card list layout showing the formatted recorded timestamp and expiration epoch.

4. **Testing Layer (`test/reference_frame_test.dart`)**
   - Added comprehensive unit tests validating:
     - Date-time parser behaviour for correct ISO 8601 UTC formatting.
     - Chronological validity checks (validating both invalid case checks and correct ordering).
     - Flat JSON serialization and deserialization of the temporal fields.

---

## Verification Results

All unit and widget tests pass successfully.

---

## Step-by-Step Human Manual Testing Instructions

To verify the Temporal Validity & Expiry registration flow, run the application:
```bash
flutter run -d linux
```

Then perform the following tests:

1. **Verify Expiration Badges on Mock Records:**
   - Look at the active registry list.
   - **Verification:** 
     - Mock entries without expiration display a grey **PERSISTENT** badge.
     - Mock entries with a future expiration display a green **ACTIVE** badge.
     - Mock entries with a past expiration display an orange **EXPIRED** badge.

2. **Verify Set Now and Relative Expiration Helpers:**
   - In the **Temporal Validity (Optional)** form section, click the **SET NOW** button.
   - **Verification:** The Recording Timestamp field immediately populates with the current time in UTC (e.g. `2026-06-01T12:00:00.000Z`).
   - Click the **+1 Hour** button.
   - **Verification:** The Valid Until field populates with an ISO 8601 timestamp exactly 1 hour after the Recording Timestamp.

3. **Verify Chronological Constraint Validation:**
   - Set the recording timestamp to `2026-06-02T12:00:00Z` and valid-until to `2026-06-01T12:00:00Z` (expiration before recording timestamp).
   - Enter all other required location coordinates and press **SAVE ENTRY**.
   - **Verification:** Submit fails and displays an error: `"valid-until must be chronologically after the recording timestamp"`.

4. **Verify Dynamic Real-Time Expiry Transition:**
   - Click **SET NOW** for the recording timestamp.
   - Set Valid Until to a time about 10 seconds in the future (e.g. manually change the minutes/seconds).
   - Save the location record.
   - **Verification:** The new record is listed in the sidebar with a green **ACTIVE** badge. After the countdown passes (as time advances), the badge dynamically flips to an orange **EXPIRED** badge in real-time without requiring a page refresh.
