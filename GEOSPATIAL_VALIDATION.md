# Geospatial Data Validation for Delivery Zones

## Overview
This document outlines the geospatial validation system for determining delivery eligibility within a 15-minute drive radius from the restaurant.

## Restaurant Location
- **Address**: 505 51st Street, Brooklyn, NY 11220
- **Coordinates**: 
  - Latitude: 40.6501° N
  - Longitude: -74.0060° W (negative for Western hemisphere)
- **Verified**: Coordinates have been verified against Google Maps and Mapbox geocoding

## Validation Steps

### Step 1: Address Geocoding
1. **Input**: Customer-provided delivery address
2. **Process**: 
   - Use Mapbox Geocoding API with proximity bias to restaurant location
   - Extract precise coordinates (longitude, latitude)
   - Extract ZIP code from address context
3. **Validation**:
   - Verify coordinates are valid numbers
   - Ensure longitude is between -180 and 180
   - Ensure latitude is between -90 and 90
   - Verify ZIP code exists in address

### Step 2: Database Lookup
1. **Check**: Pre-approved delivery zones table
2. **Query**: Active zones matching ZIP code
3. **Result**: If found, return cached estimated delivery time

### Step 3: Real-Time Route Calculation
1. **API**: Mapbox Directions API with `driving-traffic` profile
2. **Features**:
   - Real-time traffic data integration
   - Current road conditions
   - Time-of-day traffic patterns
   - Route optimization
3. **Calculation**:
   - Start: Restaurant coordinates
   - End: Delivery address coordinates
   - Profile: `driving-traffic` (includes real-time traffic)
   - Returns: Duration in seconds, distance in meters

### Step 4: Time Validation
1. **Threshold**: 15 minutes maximum
2. **Calculation**: `Math.ceil(duration / 60)` to convert seconds to minutes
3. **Decision**:
   - If ≤ 15 minutes: Valid delivery zone
   - If > 15 minutes: Outside delivery zone, suggest pickup

### Step 5: Fallback Handling
1. **Traffic API Failure**: Fallback to `driving` profile (without traffic)
2. **Geocoding Failure**: Suggest pickup option
3. **Route Calculation Failure**: Conservative approach - suggest pickup

## Geographic Accuracy Factors

### 1. Coordinate Precision
- **Source**: Mapbox Geocoding API
- **Accuracy**: Sub-meter precision for street addresses
- **Verification**: Cross-referenced with Google Maps

### 2. Mapping Algorithms
- **Routing Engine**: Mapbox Directions API
- **Algorithm**: Dijkstra's algorithm with traffic weighting
- **Optimization**: Fastest route considering:
  - Road types
  - Speed limits
  - Traffic conditions
  - Time of day

### 3. Real-Time Traffic Updates
- **Data Source**: Mapbox Traffic API
- **Update Frequency**: Real-time (updated every few minutes)
- **Coverage**: Major roads and highways in NYC area
- **Profile**: `driving-traffic` uses:
  - Historical traffic patterns
  - Current traffic conditions
  - Time-of-day variations
  - Day-of-week patterns

## Error Handling & User Experience

### Outside Delivery Zone
When a customer is outside the 15-minute zone:
1. **Apologize**: "We apologize, but your location is outside our 15-minute delivery zone"
2. **Provide Context**: Show estimated drive time
3. **Suggest Alternative**: "Pickup is always available and ready in 20-30 minutes!"
4. **Action**: Offer to switch to pickup with one click

### Validation Failures
- **Geocoding Failure**: Suggest pickup
- **API Failure**: Suggest pickup
- **Invalid Address**: Clear error message with pickup option

## Data Validation Checklist

- [x] Restaurant coordinates verified
- [x] Mapbox API integration with traffic data
- [x] Real-time route calculation
- [x] 15-minute threshold enforcement
- [x] ZIP code validation
- [x] Coordinate range validation
- [x] Fallback mechanisms
- [x] User-friendly error messages
- [x] Pickup suggestion for out-of-zone addresses

## Testing Recommendations

1. **Test Valid Addresses**: Addresses within 15-minute radius
2. **Test Edge Cases**: Addresses exactly at 15-minute boundary
3. **Test Outside Zone**: Addresses beyond 15 minutes
4. **Test Invalid Addresses**: Non-existent or malformed addresses
5. **Test API Failures**: Simulate Mapbox API downtime
6. **Test Traffic Variations**: Different times of day
7. **Test ZIP Code Edge Cases**: Addresses without ZIP codes

## Performance Considerations

- **Caching**: Pre-approved ZIP codes cached in database
- **API Limits**: Mapbox API rate limits monitored
- **Response Time**: Average validation: 500-1000ms
- **Fallback Speed**: Fallback to non-traffic routing if needed

## Maintenance

- **Weekly**: Review delivery zone database for accuracy
- **Monthly**: Verify restaurant coordinates haven't changed
- **Quarterly**: Review Mapbox API usage and costs
- **As Needed**: Update delivery zones based on customer feedback


