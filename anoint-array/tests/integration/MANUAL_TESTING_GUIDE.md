# Tax Management Interface - Manual Testing Guide

## Overview
This guide provides step-by-step instructions for manually testing the tax management interface at `http://localhost:3000/admin/products`.

## Prerequisites
- Application server running on `http://localhost:3000`
- Admin user access credentials
- Multiple browsers for cross-browser testing
- Developer tools enabled

## Test Scenarios

### 1. Tab Navigation Test 🔄

**Objective**: Verify navigation between Products Preview, Products, and Taxes tabs

**Steps**:
1. Navigate to `http://localhost:3000/admin/products`
2. Verify all three tabs are visible:
   - Products Preview (with eye icon)
   - Products (with cube icon) 
   - Taxes (with dollar icon)
3. Click each tab and verify:
   - Tab becomes active (highlighted in purple)
   - URL updates with `?tab=` parameter
   - Content changes appropriately
   - No JavaScript errors in console

**Expected Results**:
- ✅ All tabs visible and clickable
- ✅ Active tab styling applied correctly
- ✅ URL parameters update
- ✅ Content loads without errors

**Performance Metrics to Check**:
- Tab switch time: < 500ms
- No layout shift during navigation
- Memory usage remains stable

---

### 2. Tax Rates Table Test 📊

**Objective**: Verify tax rates table loads and displays all Canadian provinces

**Steps**:
1. Click the "Taxes" tab
2. Verify the tax rates table loads
3. Check for all Canadian provinces:
   - Alberta, British Columbia, Manitoba
   - New Brunswick, Newfoundland and Labrador
   - Northwest Territories, Nova Scotia, Nunavut
   - Ontario, Prince Edward Island, Quebec
   - Saskatchewan, Yukon

**Expected Results**:
- ✅ Table displays all 13 provinces/territories
- ✅ Tax rates shown for GST, PST, HST as applicable
- ✅ Data is accurate and up-to-date
- ✅ Table is sortable (if implemented)

**UI/UX Checks**:
- Table headers are clear and descriptive
- Data is properly aligned
- Loading states are handled gracefully
- Empty states are handled appropriately

---

### 3. Tax Calculator Test 🧮

**Objective**: Test tax calculations with different amounts and provinces

**Test Cases**:

#### Case 1: Ontario Calculation
- **Amount**: $100.00
- **Province**: Ontario
- **Expected**: GST 5% + PST 8% = $13.00 total tax

#### Case 2: Alberta Calculation  
- **Amount**: $250.50
- **Province**: Alberta
- **Expected**: GST 5% = $12.53 total tax

#### Case 3: Quebec Calculation
- **Amount**: $1000.00
- **Province**: Quebec
- **Expected**: GST 5% + QST 9.975% = $149.75 total tax

**Steps**:
1. Navigate to Tax Calculator (within Taxes tab)
2. Enter test amount
3. Select province from dropdown
4. Click "Calculate" button
5. Verify results are accurate

**Validation Tests**:
- Enter negative amount (should show error)
- Enter non-numeric input (should show error)
- Leave amount empty (should show error)
- Select no province (should show error)

---

### 4. Tax Rate Editor Test ✏️

**Objective**: Test editing tax rates (with mock admin access)

**Steps**:
1. In the tax rates table, look for edit buttons/icons
2. Click edit on a tax rate entry
3. Verify modal/form opens
4. Test form validation:
   - Enter invalid rate (negative, > 100%)
   - Enter non-numeric values
   - Leave required fields empty
5. Test successful edit:
   - Enter valid rate
   - Save changes
   - Verify table updates

**Expected Results**:
- ✅ Edit interface is accessible
- ✅ Form validation works correctly
- ✅ Success/error messages display
- ✅ Changes persist after save

---

### 5. Responsive Design Test 📱

**Objective**: Test interface across different viewport sizes

#### Desktop Testing (1920x1080)
- All elements visible and properly spaced
- Navigation tabs display horizontally
- Table shows all columns comfortably
- No horizontal scrolling required

#### Tablet Testing (768x1024)
- Layout adapts gracefully
- Navigation remains usable
- Table may require horizontal scroll
- Touch targets are adequately sized (min 44px)

#### Mobile Testing (375x812)
- Navigation stacks or becomes hamburger menu
- Table scrolls horizontally
- Form inputs are appropriately sized
- No content is cut off or inaccessible

**Testing Steps**:
1. Use browser dev tools to simulate different devices
2. Test common breakpoints: 1920px, 1024px, 768px, 375px
3. Verify touch interactions work on mobile
4. Check for layout breaks or overlapping elements

---

## Performance Testing Checklist

### Page Load Performance
- [ ] Initial page load < 3 seconds
- [ ] First Contentful Paint < 1.5 seconds
- [ ] Time to Interactive < 5 seconds
- [ ] No render-blocking resources

### Runtime Performance
- [ ] Tab switching < 500ms
- [ ] Calculator responds instantly
- [ ] Table sorting/filtering < 1 second
- [ ] No memory leaks during extended use

### Network Performance
- [ ] Minimize API calls
- [ ] Proper caching headers
- [ ] Compressed assets
- [ ] Progressive loading for large datasets

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab order is logical
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible
- [ ] Escape key closes modals

### Screen Reader Support
- [ ] Proper ARIA labels
- [ ] Table headers associated with data
- [ ] Form labels connected to inputs
- [ ] Status messages announced

### Visual Accessibility
- [ ] Color contrast meets WCAG AA standards
- [ ] Text is scalable to 200%
- [ ] No reliance on color alone for information
- [ ] Focus indicators have sufficient contrast

---

## Common Issues to Watch For

### Navigation Issues
- ❌ Tab not highlighting correctly
- ❌ URL not updating on tab change
- ❌ Content not loading after tab switch
- ❌ Browser back/forward breaking navigation

### Data Issues
- ❌ Missing provinces in tax table
- ❌ Incorrect tax calculations
- ❌ Tax rates not updating after edit
- ❌ Inconsistent decimal precision

### Responsive Issues
- ❌ Horizontal scroll on mobile
- ❌ Buttons too small for touch
- ❌ Text overlapping on tablet
- ❌ Table columns cutting off content

### Performance Issues
- ❌ Slow tab switching
- ❌ Calculator lag on input
- ❌ Memory leaks with repeated actions
- ❌ Large bundle sizes causing slow loads

---

## Reporting Issues

When reporting issues, include:

1. **Browser/Device**: Chrome 91, iPhone 12, etc.
2. **Steps to Reproduce**: Clear numbered steps
3. **Expected vs Actual**: What should happen vs what happened
4. **Screenshots**: Visual proof of the issue
5. **Console Errors**: Any JavaScript errors
6. **Impact**: Severity level (High/Medium/Low)

### Issue Template
```
**Title**: Brief description of issue

**Environment**: 
- Browser: 
- Device: 
- Screen Size: 

**Steps to Reproduce**:
1. Step one
2. Step two
3. Step three

**Expected Result**: What should happen

**Actual Result**: What actually happened

**Screenshots**: [Attach screenshots]

**Console Errors**: [Copy any error messages]

**Severity**: High/Medium/Low

**Additional Notes**: Any other relevant information
```

---

## Test Completion Checklist

- [ ] All 5 main test scenarios completed
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing completed on actual devices
- [ ] Performance metrics documented
- [ ] Accessibility audit completed
- [ ] Issues documented and prioritized
- [ ] Test report generated

---

## Automated Testing Integration

This manual testing guide complements the automated Puppeteer tests found in:
- `tax-management-e2e-tests.js` - Comprehensive automated test suite
- `demo-test.js` - Quick smoke test
- `run-tax-management-tests.sh` - Test runner script

Use both manual and automated testing for comprehensive coverage.