# Changelog

All notable changes to the MOWED project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
