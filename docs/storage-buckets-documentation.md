# Supabase Storage Buckets Documentation

## Overview

This document outlines the storage bucket configuration for the Anoint Array e-commerce platform. Three storage buckets have been created and configured with appropriate Row Level Security (RLS) policies.

## Storage Buckets

### 1. Arrays Bucket (`arrays`)

**Purpose**: Store user-generated mystical array images

**Configuration**:
- **Bucket Name**: `arrays`
- **Visibility**: Private (controlled by RLS policies)
- **Allowed File Types**: PNG, JPG, JPEG, PDF
- **Maximum File Size**: 10MB
- **Folder Structure**: `{user_id}/{filename}`

**Access Patterns**:
- **Base URL**: `https://xmnghciitiefbwxzhgrw.supabase.co/storage/v1/object/public/arrays/`
- **User Upload**: `arrays/{user_id}/array-{timestamp}.png`
- **Public Arrays**: `arrays/public/featured-array.png`

**RLS Policies**:
- `arrays_select_own_and_public`: Users can read their own arrays and public ones
- `arrays_insert_own_folder`: Users can upload to their own folder (`{user_id}/`)
- `arrays_update_own_files`: Users can update their own files
- `arrays_delete_own_files`: Users can delete their own files

**Usage Example**:
```javascript
// Upload array image
const { data, error } = await supabase.storage
  .from('arrays')
  .upload(`${userId}/array-${Date.now()}.png`, file, {
    contentType: 'image/png',
    upsert: false
  });

// Get array URL
const { data: urlData } = supabase.storage
  .from('arrays')
  .getPublicUrl(`${userId}/array-${Date.now()}.png`);
```

---

### 2. Glyphs Bucket (`glyphs`)

**Purpose**: Store mystical glyph and symbol images for the application

**Configuration**:
- **Bucket Name**: `glyphs`
- **Visibility**: Private (controlled by RLS policies, but publicly readable)
- **Allowed File Types**: PNG, SVG, JPG, JPEG
- **Maximum File Size**: 2MB
- **Folder Structure**: `{category}/{glyph-name}.{ext}`

**Access Patterns**:
- **Base URL**: `https://xmnghciitiefbwxzhgrw.supabase.co/storage/v1/object/public/glyphs/`
- **Symbols**: `glyphs/symbols/pentagram.svg`
- **Elements**: `glyphs/elements/fire.png`
- **Runes**: `glyphs/runes/algiz.svg`

**RLS Policies**:
- `glyphs_public_read`: Anyone can read glyph images (public access)
- `glyphs_service_role_insert`: Only service role can upload new glyphs
- `glyphs_service_role_update`: Only service role can update glyph files
- `glyphs_service_role_delete`: Only service role can delete glyph files

**Usage Example**:
```javascript
// List available glyphs (public access)
const { data: glyphs, error } = await supabase.storage
  .from('glyphs')
  .list('symbols/', {
    limit: 50,
    sortBy: { column: 'name', order: 'asc' }
  });

// Get glyph URL (always accessible)
const { data: urlData } = supabase.storage
  .from('glyphs')
  .getPublicUrl('symbols/pentagram.svg');
```

---

### 3. Receipts Bucket (`receipts`)

**Purpose**: Store order receipts and invoices for customers

**Configuration**:
- **Bucket Name**: `receipts`
- **Visibility**: Private (strictly controlled by RLS)
- **Allowed File Types**: PDF
- **Maximum File Size**: 5MB
- **Folder Structure**: `{user_id}/{order_id}-receipt.pdf`

**Access Patterns**:
- **Base URL**: `https://xmnghciitiefbwxzhgrw.supabase.co/storage/v1/object/public/receipts/`
- **User Receipt**: `receipts/{user_id}/order-{order_id}-receipt.pdf`
- **Invoice**: `receipts/{user_id}/invoice-{invoice_id}.pdf`

**RLS Policies**:
- `receipts_select_own`: Users can only read their own receipts; service role can read all
- `receipts_service_role_insert`: Only service role can create receipt files
- `receipts_service_role_update`: Only service role can update receipt files
- `receipts_service_role_delete`: Only service role can delete receipt files

**Usage Example**:
```javascript
// Generate and store receipt (server-side only)
const { data, error } = await supabaseServiceRole.storage
  .from('receipts')
  .upload(`${userId}/order-${orderId}-receipt.pdf`, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true
  });

// User downloading their receipt
const { data: receipt, error } = await supabase.storage
  .from('receipts')
  .download(`${userId}/order-${orderId}-receipt.pdf`);
```

---

## Security Implementation

### Row Level Security (RLS)

All buckets have RLS enabled with the following principles:

1. **User Isolation**: Users can only access their own files (except where explicitly allowed)
2. **Role-Based Access**: Different roles have different permissions
3. **Public vs Private**: Some content is publicly accessible, others are strictly private

### Authentication Roles

- **`authenticated`**: Regular logged-in users
- **`service_role`**: Backend/server operations (full access)
- **`anon`**: Anonymous users (limited read access to public content)

### Folder Structure Convention

- **User Files**: `{user_id}/filename.ext` - Files owned by specific users
- **Public Files**: `public/filename.ext` - Publicly accessible files
- **System Files**: `system/filename.ext` - System-generated files

---

## Environment Variables

Required environment variables for storage operations:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xmnghciitiefbwxzhgrw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Testing and Verification

### Test Results Summary

✅ **Bucket Creation**: All three buckets created successfully  
✅ **RLS Policies**: 12 security policies implemented  
✅ **Upload/Download**: Basic functionality verified  
✅ **Security**: Anonymous access properly blocked  
✅ **Admin Access**: Service role has full access to all buckets  

### Test Scripts Available

- `scripts/create-storage-buckets.js` - Initial bucket creation
- `scripts/create-storage-policies.js` - RLS policy setup  
- `scripts/fix-storage-policies.js` - Policy improvements
- `scripts/test-storage-buckets.js` - Upload/download testing
- `scripts/test-storage-permissions.js` - Security verification

---

## Integration with Application

### Client-Side Usage

```javascript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

const supabase = createClientComponentClient();

// Upload user's array
export async function uploadArray(userId, file) {
  const filename = `${userId}/array-${Date.now()}.png`;
  
  const { data, error } = await supabase.storage
    .from('arrays')
    .upload(filename, file, {
      contentType: file.type,
      upsert: false
    });
    
  if (error) throw error;
  return data;
}
```

### Server-Side Usage

```javascript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

// Generate receipt (server-side only)
export async function generateReceipt(userId, orderId, pdfBuffer) {
  const supabase = createServerComponentClient({ cookies });
  
  const filename = `${userId}/order-${orderId}-receipt.pdf`;
  
  const { data, error } = await supabase.storage
    .from('receipts')  
    .upload(filename, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true
    });
    
  if (error) throw error;
  return data;
}
```

---

## Troubleshooting

### Common Issues

1. **Upload Fails with "RLS Policy Violation"**
   - Ensure user is authenticated
   - Check folder structure matches `{user_id}/filename` pattern
   - Verify file type is allowed for the bucket

2. **Cannot Access Files**
   - Check if user owns the file (for arrays/receipts)
   - Verify bucket permissions
   - Ensure proper authentication

3. **File Size Exceeded**
   - Arrays: Max 10MB
   - Glyphs: Max 2MB  
   - Receipts: Max 5MB

### Maintenance

- Monitor storage usage in Supabase dashboard
- Regularly review RLS policies for security
- Clean up test files and old uploads
- Update file size limits as needed

---

**Created**: August 11, 2025  
**Last Updated**: August 11, 2025  
**Version**: 1.0.0