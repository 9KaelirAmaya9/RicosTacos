# Map Loading Issue - Troubleshooting Report

## Step 1: Issue Identification

### Potential Issues Found:

1. **Race Condition with Map Events**
   - `map.current.once('idle')` might not fire if map is already idle
   - `loadServiceArea` might be called before map is ready

2. **Double Event Listener**
   - Both `map.current.on('load', loadServiceArea)` and `if (map.current.loaded())` could cause double execution

3. **Missing Map Initialization Error Handling**
   - No error state if map fails to initialize (invalid token, network error)

4. **Bounds Fitting Timing Issue**
   - `fitBounds` called inside `once('idle')` but layers added before map is idle
   - Event might not fire if map is already idle when layers are added

5. **Token Validation**
   - Token check happens but no error message if token is invalid

## Step 2: Testing Each Issue

### Test 1: Token Missing
**Method**: Remove token from environment
**Expected**: Should show "Map loading..." message
**Actual**: Need to verify

### Test 2: Map Initialization Failure
**Method**: Use invalid token
**Expected**: Should show error
**Actual**: Need to verify

### Test 3: Event Timing
**Method**: Check if `once('idle')` fires correctly
**Expected**: Should fire after layers are added
**Actual**: May not fire if map is already idle

### Test 4: Double Execution
**Method**: Check console logs
**Expected**: `loadServiceArea` should only be called once
**Actual**: May be called twice

## Step 3: Fixes to Implement

1. Add map initialization error handling
2. Fix event listener timing
3. Ensure bounds fitting happens at correct time
4. Add better error messages
5. Prevent double execution

