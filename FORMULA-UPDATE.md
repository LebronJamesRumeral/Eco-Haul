# Payroll Calculation Formula Update

## New Formula (Based on Excel Tracker)

The system now uses the accurate formula from the Excel CBM Tracker:

```
TOTAL COST = TRIPS × PRICE/UNIT × VOLUME
```

### Components:

1. **TRIPS** - Number of trips completed
2. **PRICE/UNIT** - Site-specific pricing per CBM or TON
3. **VOLUME** - Net capacity = Dump Box Capacity × 0.95 (5% reduction)

### Example Calculation:

```
Truck: NLA8898 (Dump Box: 21.33 CBM)
Site: ERAMEN CBM (Price: ₱281.69/CBM)
Trips: 5

Net Volume = 21.33 × 0.95 = 20.26 CBM
Total Cost = 5 × 281.69 × 20.26 = ₱28,543.37
```

## Database Changes

### PayrollRecords Table
- ❌ Removed: `distance`, `tonnage`
- ✅ Added: `truck_id`, `truck_number`, `price_per_unit`, `volume`, `unit_type`

### Trucks Table
- ✅ Added: `net_capacity` (auto-calculated as capacity × 0.95)

### BillingRates Table
- Restructured to support site-specific pricing
- Each site can have custom `price_per_unit` and `unit_type` (CBM/TON)
- Includes `reduction_factor` (default: 0.95 for 5% reduction)

## UI Updates

### Billing Page
1. **Trip Input Form:**
   - Select truck (auto-fills volume)
   - Select site (auto-fills price)
   - Enter number of trips
   - Volume and price can be manually adjusted if needed

2. **Calculation Display:**
   - Shows breakdown: Trips × Price × Volume
   - Real-time total calculation
   - Formula explanation with current values

3. **Payroll History:**
   - Displays: Driver, Truck, Site, Trips, Price, Volume, Total
   - Site badge for easy identification
   - Updated print receipt with new formula

### Settings Page
- Formula explanation card at top
- Legacy rate configuration marked as deprecated
- Site management for configuring site-specific prices

## Migration Steps

1. **Run SQL Migration:**
   ```bash
   # Execute: supabase-update-payroll-formula.sql
   ```

2. **Configure Sites:**
   - Go to Settings → Site Management
   - Add mining sites with locations
   - Each site will get default price of ₱281.69/CBM

3. **Update Truck Capacities:**
   - Ensure all trucks have correct `capacity` (dump box volume)
   - System will auto-calculate `net_capacity` (95% of capacity)

4. **Start Using New System:**
   - Go to Billing & Payroll
   - Select truck and site when creating entries
   - System will auto-populate volume and price
   - Adjust if needed for specific cases

## Formula Logic Flow

```
1. User selects TRUCK
   ↓
   System auto-fills VOLUME (truck.capacity × 0.95)

2. User selects SITE
   ↓
   System auto-fills PRICE/UNIT (site default rate)

3. User enters TRIPS
   ↓
   System calculates: TRIPS × PRICE/UNIT × VOLUME
   ↓
   Display TOTAL COST
```

## Site-Specific Pricing Examples

| Site | Price/Unit | Unit Type | Example (5 trips, 20.26 net CBM) |
|------|------------|-----------|-----------------------------------|
| ERAMEN CBM | ₱281.69 | CBM | 5 × 281.69 × 20.26 = ₱28,543.37 |
| BENGUET | ₱180.00 | TON | 5 × 180.00 × 20.26 = ₱18,234.00 |

## Benefits

✅ **Accurate:** Matches Excel tracker calculations exactly
✅ **Flexible:** Supports both CBM and TON measurements
✅ **Site-Specific:** Different rates for different mining sites
✅ **Transparent:** Clear formula display in UI
✅ **Auditable:** All calculation components stored in database
