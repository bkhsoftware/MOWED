# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2024-08-25

### Added
- Implemented multi-year planning capability.
- Added optimization for carbon sequestration and biodiversity.
- Included detailed results display with tree counts and environmental impact.
- Implemented warning system for optimization issues.
- Added advanced options for fine-tuning the optimization process.
- Added optional optimization for environmental factors: soil quality, climate zone, elevation and annual rainfall
- Added optional solver COBYLA
- Added optional debug print

### Fixed
- Resolved JSON parsing issues between Python and JavaScript.
- Fixed warning display to show unique warnings with count.

### Changed
- Improved error handling and user feedback.
- Enhanced the UI for a more intuitive user experience.

## [0.1.0] - 2024-08-20

### Added
- Project initialization.
- Basic structure for the web application.
- Implemented reforestation optimization algorithm using Python and SciPy with solver SLSQP
- Added feature to input budget, land area, and multiple tree species characteristics.
- Created web-based interface using HTML, CSS, and JavaScript.
- Integrated Pyodide for running Python code in the browser.
