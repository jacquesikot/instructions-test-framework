# Select Component Instructions

## Overview

The shadcn/ui Select component is a customizable dropdown selector built on top of Radix UI. It provides accessible selection with keyboard navigation and custom styling, commonly used in forms and data filtering interfaces.

## Common Pitfalls

### 1. Performance Degradation with Large Item Lists

**Issue**: Select component becomes slow and unresponsive when rendering large numbers of options in the dropdown menu
**Symptoms**:

- Slow dropdown opening/closing animation
- Laggy scrolling within the dropdown list
- Browser becomes unresponsive during interaction
- High memory usage and CPU consumption
  **Solution**: Implement virtualization using React Window when the item count exceeds 200 items

**Example**:

```jsx
// ❌ Wrong way
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    {largeDataset.map((item) => (
      <SelectItem key={item.id} value={item.value}>
        {item.label}
      </SelectItem>
    ))}
  </SelectContent>
</Select>;

// ✅ Correct way
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FixedSizeList as List } from 'react-window';

const VirtualizedSelect = ({ items, ...props }) => {
  if (items.length > 200) {
    return (
      <Select {...props}>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          <List height={200} itemCount={items.length} itemSize={35} itemData={items}>
            {({ index, style, data }) => (
              <div style={style}>
                <SelectItem value={data[index].value}>{data[index].label}</SelectItem>
              </div>
            )}
          </List>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select {...props}>
      <SelectTrigger>
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.id} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
```

### 2. Focus Management Issues After Selection

**Issue**: Input elements lose focus after select value changes, disrupting user workflow in forms
**RelatedComponents**: input
**Symptoms**:

- Input field doesn't automatically receive focus after selection
- User must manually click on input field to continue typing
- Poor user experience in multi-field forms
- Tab order becomes disrupted
  **Solution**: Introduce a short delay (100ms) before focusing to allow DOM updates to complete

**Example**:

```jsx
// ❌ Wrong way
import { useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const FormWithSelect = () => {
  const inputRef = useRef(null);

  const handleSelectChange = (value) => {
    // Process selection
    setSelectedValue(value);
    inputRef.current?.focus(); // This fails due to DOM not being updated
  };

  return (
    <div>
      <Select onValueChange={handleSelectChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
      <Input ref={inputRef} placeholder="Enter details..." />
    </div>
  );
};

// ✅ Correct way
import { useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const FormWithSelect = () => {
  const inputRef = useRef(null);

  const handleSelectChange = (value) => {
    // Process selection
    setSelectedValue(value);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100); // Small delay to ensure the DOM is updated
  };

  return (
    <div>
      <Select onValueChange={handleSelectChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
      <Input ref={inputRef} placeholder="Enter details..." />
    </div>
  );
};
```
