# Sorter - Pairwise Comparison App Requirements

## Overview
A single-page web application that helps users sort a list of items through pairwise comparisons. The app uses a scientific approach to sorting by comparing items two at a time until a stable order is achieved.

## Technical Stack
- Pure HTML5
- Pure CSS3
- Pure JavaScript (No frameworks)

## Application States

### 1. Editing/Empty State
- Title: "Edit list"
- Empty text area for adding list items
- "Use animals example" button
- Disabled "Save list" button

### 2. Editing/Populated State
- Title: "Edit list"
- Text area with populated items
- Active "Save list" button
- "Use animals example" button

### 3. Sorting/Unstable State
- Title: "Compare"
- Display of two items for comparison
- Counter showing remaining choices
- "Edit list" button to return to editing state
- Progress indicator for sorting stability

### 4. Stable State (Final)
- Title: "Sorted"
- Display of final sorted list
- Confidence level indicator
- "Copy list" button
- "Edit list" button

## Core Features

### List Management
- Text area for manual list entry
- Support for image file input via drag and drop
- Image preview functionality with remove option
- Quick-fill example with predefined animal list
- Ability to edit list at any time
- Save functionality for current list
- Mixed content support (text and images in the same list)

### Sorting Algorithm
- Implementation of uncertainty sampling for pair selection
- Calculation of approximate remaining comparisons needed
- Stability detection using confidence metrics
- Scientific confidence level display (e.g., "155%")

### User Interface
- Clean, minimal design
- Clear state transitions
- Responsive layout
- Intuitive comparison interface
- Visual preview grid for uploaded images
- Drag and drop zone with visual feedback
- Remove buttons for individual items

## User Interactions
1. List Creation/Editing
   - Manual text entry
   - One-click example list population
   - List saving functionality
   - Image upload via drag and drop

2. Comparison Process
   - Binary choice between two items
   - Clear visual presentation of choices
   - Progress indication
   - Ability to return to editing

3. Results Management
   - Final sorted list display
   - List copying functionality
   - Option to start over or edit

## Technical Requirements

### Performance
- Instant state transitions
- Efficient sorting algorithm implementation
- Smooth animations for state changes

### Data Management
- Local state management
- No backend required
- Session persistence
- Efficient image handling using data URLs
- Support for multiple file types (text and images)

### Browser Compatibility
- Support for modern browsers
- Responsive design for different screen sizes

## Future Considerations
- Export functionality
- Different sorting algorithms
- Custom styling options
- List templates
- Undo functionality
- Batch image import
- Image optimization
- Cloud storage integration

## Development Guidelines
- Clean, modular code structure
- Clear state management
- Comprehensive comments
- Mobile-first approach
