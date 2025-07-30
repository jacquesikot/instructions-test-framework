# Button Component Instructions

## Overview

The shadcn/ui Button component is a versatile, accessible button built on top of Radix UI Slot. It provides consistent styling with multiple variants (default, destructive, outline, secondary, ghost, link) and sizes, commonly used for actions, form submissions, and navigation throughout applications.

## Common Pitfalls

### 1. Loading State Implementation Without Proper Accessibility

**Issue**: Button component doesn't provide proper feedback during async operations, leaving users uncertain about action status
**RelatedComponents**: spinner, loader
**Symptoms**:

- Users click multiple times during loading, causing duplicate requests
- No visual indication that an action is in progress
- Screen readers don't announce loading state changes
- Button remains clickable during async operations
  **Solution**: Implement proper loading state with disabled functionality and aria-label updates

**Example**:

```jsx
// ❌ Wrong way
import { Button } from '@/components/ui/button';

const SubmitButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await submitForm();
    setIsLoading(false);
  };

  return <Button onClick={handleSubmit}>{isLoading ? 'Loading...' : 'Submit'}</Button>;
};

// ✅ Correct way
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const SubmitButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await submitForm();
    setIsLoading(false);
  };

  return (
    <Button onClick={handleSubmit} disabled={isLoading} aria-label={isLoading ? 'Submitting form...' : 'Submit form'}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? 'Submitting...' : 'Submit'}
    </Button>
  );
};
```

### 2. Icon Button Accessibility Issues

**Issue**: Icon-only buttons lack proper accessibility labels, making them unusable for screen reader users
**RelatedComponents**: lucide-react icons
**Symptoms**:

- Screen readers announce "button" without context
- Users with visual impairments cannot understand button purpose
- Fails accessibility audits and WCAG compliance
- Poor user experience for assistive technology users
  **Solution**: Always provide descriptive aria-label or sr-only text for icon buttons

**Example**:

```jsx
// ❌ Wrong way
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Share } from 'lucide-react';

const ActionButtons = () => {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="icon">
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon">
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon">
        <Share className="h-4 w-4" />
      </Button>
    </div>
  );
};

// ✅ Correct way
import { Button } from '@/components/ui/button';
import { Trash2, Edit, Share } from 'lucide-react';

const ActionButtons = () => {
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" aria-label="Delete item">
        <Trash2 className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" aria-label="Edit item">
        <Edit className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" aria-label="Share item">
        <Share className="h-4 w-4" />
      </Button>
    </div>
  );
};
```

### 3. Form Submission Button Type Attribute Missing

**Issue**: Button components in forms don't specify the correct type attribute, causing unexpected form behavior
**RelatedComponents**: form, input
**Symptoms**:

- Form submits when clicking non-submit buttons
- Unexpected page refreshes during form interaction
- JavaScript form validation bypassed
- Poor form user experience and data loss
  **Solution**: Explicitly set button type attribute based on intended behavior

**Example**:

```jsx
// ❌ Wrong way
import { Button } from '@/components/ui/button';

const ContactForm = () => {
  const handleReset = () => {
    // Reset form logic
  };

  const handleSave = () => {
    // Save draft logic
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" placeholder="Email" />
      <input type="text" placeholder="Message" />

      <div className="flex gap-2">
        <Button onClick={handleReset}>Reset</Button>
        <Button onClick={handleSave}>Save Draft</Button>
        <Button>Submit</Button>
      </div>
    </form>
  );
};

// ✅ Correct way
import { Button } from '@/components/ui/button';

const ContactForm = () => {
  const handleReset = () => {
    // Reset form logic
  };

  const handleSave = () => {
    // Save draft logic
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" placeholder="Email" />
      <input type="text" placeholder="Message" />

      <div className="flex gap-2">
        <Button type="button" onClick={handleReset}>
          Reset
        </Button>
        <Button type="button" onClick={handleSave}>
          Save Draft
        </Button>
        <Button type="submit">Submit</Button>
      </div>
    </form>
  );
};
```
