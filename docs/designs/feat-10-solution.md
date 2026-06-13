# Solution Walkthrough - Feature 10: Addresses, Identity, and Language Tags (Issue #21)

This document details the vertical slice implementation of Feature 10 (Addresses, Identity, and Language Tags) targeting the Flutter platform.

## Implemented Changes

1. **Logic & Model Layer (`lib/models/address_tag.dart`)**
   - Created the `YangAddressTagType` enum covering `physAddress`, `macAddress`, `xpath10`, `hexString`, `uuid`, `dottedQuad`, and `languageTag`.
   - Created the `YangAddressTagReference` model class representing individual address, identity, or tag nodes.
   - Implemented validation rules in `YangAddressTagValidator`:
     - Regular expression validation matching standard IETF definitions for UUID, MAC, dotted-quad, language-tag, and hex/phys-addresses.
     - Dotted-quad range checking (0-255 boundary checks for all four octets).
     - XPath 1.0 bracket balancing validation.
     - **Case Normalization**: Input values for `macAddress`, `physAddress`, `hexString`, `uuid`, and `languageTag` are automatically normalized to lowercase for canonical storage and representation.

2. **Mock Data Layer (`lib/services/mock_address_tag_service.dart`)**
   - Implemented a singleton `MockAddressTagService` managing a mock registry of address/tag nodes (e.g. `Active Controller UUID`, `SDN Switch MAC Address`, `NIC Hardware Physical Address`, `Management Interface Dotted-Quad`, `Preferred System Language Tag`, `Default Config XPath Filter`, and `Diagnostic Payload Hex-String`).

3. **UI & Presentation Layer (`lib/main.dart`)**
   - Integrated sidebar navigation to allow users to switch to the "Addresses & Tags" screen.
   - Built the Addresses & Tags dashboard including:
     - **Dashboard Header:** Responsive title and metadata badge.
     - **Summary Row:** Visual counters of total nodes, address types, and identities/tags.
     - **Update Value Card:** Select target nodes, modify values, validate in real time, and present error notifications.
     - **Node Registry List Pane:** Showing detailed items, color-coded badges, description tooltips, and monospaced canonical values.

4. **Testing Layer (`test/address_tag_test.dart`)**
   - Created unit tests verifying pattern matches, case normalization, boundary validations (e.g., dotted-quad bounds), and XPath brackets check.
   - Created widget UI tests checking navigation drawer access, node selections, update forms, and validation errors.

---

## Verification Results

All logic unit tests and widget UI tests pass successfully:
```bash
flutter test test/address_tag_test.dart
```

---

## Step-by-Step Human Manual Testing Instructions

To verify the Addresses & Tags dashboard flow:

1. Run the application:
   ```bash
   flutter run -d linux
   ```
2. Navigate to the Addresses & Tags screen:
   - Click the hamburger button or slide out the navigation drawer, and tap **Addresses & Tags**.
   - **Verification:** The screen title transitions to `Addresses & Tags Dashboard`.
3. Verify Case Normalization (MAC Address):
   - Select **SDN Switch MAC Address** (type `mac-address`) in the update card.
   - Input `00:1A:2B:3C:4D:5E` (with uppercase letters) and click **UPDATE VALUE**.
   - **Verification:** SnackBar confirms successful update, and the registry list reflects the normalized lowercase value: `00:1a:2b:3c:4d:5e`.
4. Verify Dotted-Quad Octet Boundary Check:
   - Select **Management Interface Dotted-Quad** (type `dotted-quad`) in the update card.
   - Input `192.168.1.300` (octet exceeds 255) and click **UPDATE VALUE**.
   - **Verification:** Validation rejects the value with an error message: `Invalid dotted-quad format: '192.168.1.300'. Must be 4 octets separated by dots, each in range [0, 255].`.
   - Input `192.168.1.55` and click **UPDATE VALUE**.
   - **Verification:** Value is successfully updated in the list.
5. Verify Language Tag validation and normalization:
   - Select **Preferred System Language Tag** (type `language-tag`).
   - Input `en-US` and click **UPDATE VALUE**.
   - **Verification:** SnackBar confirms successful update, and value is shown as normalized `en-us`.
6. Verify Hex String optional/empty value acceptance:
   - Select **Diagnostic Payload Hex-String** (type `hex-string`).
   - Clear the input field (leave empty) and click **UPDATE VALUE**.
   - **Verification:** SnackBar confirms successful update, and the list displays `Value: ` (empty string is acceptable under RFC definitions for physical-address and hex-string).
