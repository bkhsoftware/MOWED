# Changelog

All notable changes to the MOWED project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3] - 2024-10-07

### Added
- Enhanced ModuleInterface with improved validation methods
- Implemented custom validation for each module
- Added min, max, and step properties to input fields for better user guidance

### Changed
- Refactored all module components (Personal Finance, Education, Reforestation, Small Business) to use new shared components
- Updated all modules to use the new ModuleForm component with enhanced input handling
- Standardized error handling across all modules

### Improved
- Enhanced data validation and error reporting in all modules
- Optimized calculation methods in Reforestation module
- Improved consistency in result formatting across all modules

### Fixed
- Resolved issues with input validation in the Small Business module
- Fixed potential data type issues in calculations across all modules

## [0.2.2] - 2024-10-06

### Added
- Created ResultsDisplay component for standardized result presentation
- Developed reusable ChartComponent for flexible data visualization using Chart.js

### Changed
- Started refactoring module components to use new shared components (ResultsDisplay, ChartComponent)
- Began standardizing module interface and result structure across modules

### In Progress
- Enhancing ModuleForm component to handle various input types
- Refining ModuleInterface to accommodate all module requirements
- Improving error handling and validation for all modules

### Improved
- Enhanced data visualization capabilities in implemented modules
- Started optimizing code reusability and maintainability through shared components

## [0.2.1] - 2024-09-29

### Added
- Comprehensive test coverage for all core components and modules
- Detailed TODO list for Phase 2: MVP Development (4 Initial Modules)
- In-depth technical guidelines for development best practices

### Changed
- Updated ModuleInterface tests to cover more scenarios
- Enhanced serviceWorker tests for better coverage
- Refined error handling in ModuleInterface

### Fixed
- Resolved issues with EventBus usage in components
- Fixed data serialization problems in IndexedDBAdapter

## [0.2.0] - 2024-09-22

### Added
- Implemented ModuleForm component for dynamic form generation
- Added IndexedDB adapter for improved data persistence
- Implemented EventBus for better inter-component communication
- Added comprehensive unit tests for components and utilities
- Implemented offline functionality using Service Workers
- Added integration tests for module registration and data persistence
- Implemented Education, Reforestation, and Small Business modules
- Enhanced Vuex store with actions for offline queue management
- Improved error handling and input validation in modules

### Changed
- Refactored ModuleSelector to use Vuex for state management
- Updated project structure to better accommodate multiple modules
- Improved data persistence strategy using both localStorage and IndexedDB
- Enhanced testing setup with Jest configurations for browser API mocking

### Fixed
- Resolved issues with module selection persistence
- Fixed data synchronization issues in offline mode

## [0.1.0] - 2024-09-08

### Added
- Initial project setup
- Basic "Hello World" Vue.js application
- Core functionality for module system
- Personal Finance module with basic optimization logic
- State management using Vuex
- Data persistence using localStorage
- User interface for module selection and data input
- Results display for Personal Finance module
- Unit tests for core functionality
- End-to-end tests using Cypress
- Basic styling and layout improvements
- Bar chart visualization for Personal Finance results using Chart.js

### Changed
- Improved spacing between form labels and input fields

### Fixed
- Module selection persistence on page refresh
