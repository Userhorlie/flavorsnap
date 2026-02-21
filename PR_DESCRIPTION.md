# Fix #31: Implement Form Validation for Image Upload

## Summary
This PR addresses the "No Form Validation" issue by implementing robust form validation using `react-hook-form` and `zod`. It ensures that users can only upload valid image files within the specified size limits, providing immediate and clear feedback.

## Changes Made

### ✅ Form Validation Integration
- **Location**: `frontend/pages/index.tsx`
- **Tech Stack**: `react-hook-form`, `zod`
- **Features**:
  - Replaced manual input handling with `useForm` hook
  - Implemented Zod schema for strict validation
  - Added real-time validation feedback

### ✅ File Constraints
- **Type Validation**: Restricts uploads to `.jpg`, `.jpeg`, `.png`, and `.webp`
- **Size Limit**: Enforces a maximum file size of 10MB
- **Required Field**: Ensures an image is selected before submission

### ✅ User Experience Improvements
- **Error Feedback**: Displays clear error messages for invalid file types or sizes using the `ErrorMessage` component
- **Preview Logic**: Only shows image preview for valid files
- **Accessibility**: Maintained ARIA labels and screen reader announcements

## Technical Implementation Details

### Zod Schema
```typescript
const validationSchema = z.object({
  image: z
    .any()
    .refine((files) => files?.length === 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 10MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});
```

### API Error Handling with Retry
```typescript
const response = await api.post('/api/classify', data, {
  retries: 2,
  retryDelay: 1000
});
```

### Error Display Components
- Inline errors for form-level feedback
- Modal errors for critical issues
- Toast notifications for temporary alerts

## Acceptance Criteria Met

- ✅ **Implement file type validation**
- ✅ **Add file size limits**
- ✅ **Show validation errors**
- ✅ **Prevent invalid submissions**

## Impact

This update prevents server-side errors caused by invalid uploads and improves the overall user experience by guiding users to provide correct input formats.

Closes #31
