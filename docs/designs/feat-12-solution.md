# Solution Walkthrough - Feature 12: Location Physical Addresses (Issue #30)

This document details the vertical slice implementation of Feature 12 (Location Physical Addresses) targeting the Flutter platform.

## Implemented Changes

1. **Logic & Model Layer (`lib/models/inventory_location.dart`)**
   - Created the `PhysicalAddress` class to represent the geographic mailing address container containing `address`, `postalCode`, `state`, `city`, and `countryCode` attributes.
   - Added validation logic in `InventoryLocationValidator.validateCountryCode` checking that country codes match the ISO 3166-1 Alpha-2 uppercase regex `^[A-Z]{2}$`.
   - Implemented helper methods:
     - `toPostalLabel()`: Formats address parameters into a clean human-readable standard mailing label.
     - `toMapSearchQuery()`: Computes an external Google Maps search engine query link containing the address coordinates.
   - Associated the `PhysicalAddress? physicalAddress` attribute with the parent `InventoryLocation` model structure.

2. **Mock Data Layer (`lib/services/mock_inventory_location_service.dart`)**
   - Updated default registry nodes initialization (e.g. `loc-london-hq`) to assign mock geographic physical addresses.
   - Enhanced `addLocation` and `updateLocation` service hooks to process the new physical address attributes and validate country code patterns.

3. **UI & Presentation Layer (`lib/main.dart`)**
   - Added `TextEditingController` state managers for all address components: street address, city, state/region, zip code, and country code.
   - Expanded the **Location Form Card**:
     - Added an optional section for "Physical Address Details".
     - Implemented real-time form validation of the `Country Code` input.
   - Enhanced the **Registry Tree List View**:
     - Configured the dashboard list card nodes to show a location icon (`Icons.location_on`) and the formatted postal address.
     - Added a clickable `View Map` link next to the address to trigger a SnackBar displaying the computed map search URL.

4. **Testing Layer (`test/physical_address_test.dart`)**
   - Added logical unit tests verifying `toPostalLabel()`, `toMapSearchQuery()`, and regex-based country code validators.
   - Added widget tests verifying:
     - View Map SnackBar triggers with correct map links.
     - Form input validations (e.g., rejecting lowercase `it`, uppercase `IT` success).

---

## Verification Results

All unit and widget tests pass:
```bash
flutter test test/physical_address_test.dart
```

---

## Step-by-Step Human Manual Testing Instructions

To verify the Physical Address capability in the Locations console:

1. Start the application:
   ```bash
   flutter run -d linux
   ```
2. Navigate to **Inventory Locations**:
   - Tap the sidebar menu and select **Inventory Locations**.
3. Verify Address Rendering:
   - Locate the root site `loc-london-hq` in the hierarchy tree.
   - **Verification:** An address label `100 Victoria Embankment, London, Greater London EC4Y 0DY, GB` is rendered below the node title.
4. Verify View Map Action:
   - Click the **View Map** link next to the address.
   - **Verification:** A SnackBar notification appears displaying the Google Maps search URL:
     `Map Link: https://www.google.com/maps/search/?api=1&query=100%20Victoria%20Embankment...`
5. Verify Edit and Country Code Validation:
   - Click the **Edit** icon next to `loc-london-hq`.
   - Scroll down to the **Physical Address (Optional)** section.
   - In the **Country Code (ISO-2)** field, change the value to `usa` or `us` (lowercase) and click **Update Location**.
   - **Verification:** An error message appears stating `Country code must be a valid ISO 3166-1 Alpha-2 uppercase 2-letter code`.
   - Change the country code to `US` (uppercase) and click **Update Location**.
   - **Verification:** SnackBar displays `Successfully updated` and the registry updates to render the address ending with `, US`.
