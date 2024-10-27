=======
# MOWED (Mathematical Optimization With End-user Devices)

MOWED is a web-based application that brings the power of mathematical optimization to end-users, making it accessible and user-friendly for various applications.

## Tagline

"MOWED: Mowing down inequalities"

## Description

MOWED aims to democratize access to optimization tools, bridging the gap between optimization experts and the general public. It provides a user-friendly interface for various optimization problems, including personal finance management, education resource allocation, reforestation planning, and small business optimization.

## Features

- Modular architecture for easy addition of new optimization problems
- Multiple optimization modules: Personal Finance, Education, Reforestation, and Small Business
- Sample data functionality for quick exploration and testing
- Data persistence using browser storage (localStorage and IndexedDB)
- Offline capabilities with background sync (PWA)
- Interactive UI with real-time optimization results
- Visualization of results using Chart.js
- State management with Vuex
- Responsive design for various device sizes

## Technical Stack

### Frontend
- **Framework**: Vue.js 3 and Composition API
- **Build Tool**: Vite
- **State Management**: Vuex 4
- **UI Components**: Custom Vue components
- **Styling**: CSS with scoped styles in Vue components

### Data Management
- **Local Storage**: Browser's localStorage API for quick access
- **IndexedDB**: For larger datasets and offline support
- **State Management**: Vuex store for application-wide state

### Optimization Engine
- Custom JavaScript implementations for each module
- Designed to be extensible for more complex algorithms in the future

### Testing
- **Unit Testing**: Jest with Vue Test Utils
- **End-to-End Testing**: Cypress
- **Integration Testing**: Jest

## Project Structure

The MOWED project follows a typical Vue.js application structure with some custom directories for optimization modules. Here's an overview of the main directories and their purposes:
mowed/
├── public/                              # Static assets served as-is
│   ├── favicon.ico                      # Website favicon
│   └── index.html                       # Main HTML file
├── src/                                 # Source files for the application
│   ├── assets/                          # Static assets that will be processed by Vite
│   ├── components/                      # Vue components
│   └── ModuleSelector.vue
│   ├── core/                            # Core functionality and interfaces
│   │   └── ModuleInterface.js           # Base class for optimization modules
│   ├── modules/                         # Optimization module implementations
│   ├── personal-finance/
│   │   ├── index.js                     # Personal Finance module
│   │   └── PersonalFinanceComponent.vue
│   ├── store/                           # Vuex store for state management
│   │   └── index.js                     # Main store file
│   ├── utils/                           # Utility functions
│   │   └── storage.js                   # LocalStorage utilities
│   ├── App.vue                          # Root Vue component
│   └── main.js                          # Application entry point
├── tests/                               # Test files
│   ├── unit/                            # Unit tests (Jest)
│   └── e2e/                             # End-to-end tests (Cypress)
├── .gitignore                           # Git ignore file
├── package.json                         # NPM package configuration
├── vite.config.js                       # Vite configuration
├── jest.config.js                       # Jest configuration for unit tests
├── cypress.config.js                    # Cypress configuration for e2e tests
└── README.md                            # This file

### Directory Purposes:

- `public/`: Contains static assets that are served as-is. The `index.html` file here is the main entry point for the application.

- `src/`: The main source directory for the application code.
  - `assets/`: Static files that will be processed by Vite (e.g., images, styles).
  - `components/`: Vue components used throughout the application.
  - `core/`: Core functionality, including the `ModuleInterface` base class for optimization modules.
  - `modules/`: Implementation of specific optimization modules (e.g., PersonalFinance).
  - `store/`: Vuex store for centralized state management.
  - `utils/`: Utility functions, including storage helpers for localStorage.

- `tests/`: Contains all test files.
  - `unit/`: Jest unit tests for individual components and functions.
  - `e2e/`: Cypress end-to-end tests for testing the application as a whole.

- Configuration files:
  - `vite.config.js`: Configuration for the Vite build tool.
  - `jest.config.js`: Configuration for Jest unit testing.
  - `cypress.config.js`: Configuration for Cypress e2e testing.
  - `package.json`: NPM package configuration and script definitions.

This structure is designed to keep the codebase organized and modular, allowing for easy expansion with new optimization modules and features.

### Data Visualization
- Chart.js for creating interactive and responsive charts

### Module System
- Custom module interface for creating new optimization modules
- Dynamic module loading using Vue's component system

## Getting Started

### Prerequisites

- Node.js (version 14 or later recommended)
- npm (usually comes with Node.js)

### Installation

1. Clone the repository:
git clone https://github.com/bkhsoftware/mowed.git
cd mowed

2. Install dependencies:
npm install

3. Start the development server:
npm run dev

4. Open your browser and navigate to `http://localhost:3000`

## Running Tests

- To run unit tests:
  ```
  npm run test:unit
  ```
- To run end-to-end tests:
  ```
  npm run test:e2e
  ```

## Building for Production

To create a production build:
npm run build
Copy
The built files will be in the `dist/` directory.

## Adding a New Module

1. Create a new file in `src/modules/` for your module (e.g., `NewModule.js`)
2. Implement the module interface (see `PersonalFinance.js` for an example)
3. Create a corresponding Vue component in `src/components/`
4. Register the module in `src/main.js`
5. Add the module to the module selector in `src/components/ModuleSelector.vue`

## State Management

The Vuex store is defined in `src/store/index.js`. It handles:

- Current selected module
- Module-specific data
- Application-wide settings (if any)

## Development Guidelines

To ensure consistency and prevent common errors when working on MOWED, please follow these guidelines:

1. Consult the [TECHNICAL_GUIDELINES.md](TECHNICAL_GUIDELINES.md) document for detailed information on the core architecture, common pitfalls, and best practices.

2. When working with the EventBus:
   - Always use `EventBus.on()` to subscribe to events in the `created` hook
   - Always use `EventBus.off()` to unsubscribe from events in the `beforeUnmount` hook

3. When creating new modules:
   - Extend the `ModuleInterface` class
   - Implement all required methods: `getName()`, `getDescription()`, `_solve()`, `getInputFields()`
   - Use `EventBus.emit()` to communicate module state changes

4. Follow the Vue.js style guide and use meaningful commit messages

5. Write unit tests for all new functionality and ensure all tests pass before submitting a pull request

6. Use the IndexedDBAdapter for data persistence, ensuring proper serialization of data

7. Implement error handling in all asynchronous operations

8. Refer to the Phase 2 TODO list in [PHASE_2_TODO.md](PHASE_2_TODO.md) for current development priorities

By following these guidelines, we can maintain a high-quality codebase and minimize errors in development.

## Data Persistence

Data is persisted using the browser's localStorage. The implementation can be found in `src/utils/storage.js`.

## Built With

- [Vue.js](https://vuejs.org/) - The web framework used
- [Vuex](https://vuex.vuejs.org/) - State management
- [Vite](https://vitejs.dev/) - Build tool and development server
- [Chart.js](https://www.chartjs.org/) - Used for data visualization
- [Jest](https://jestjs.io/) - Testing framework
- [Cypress](https://www.cypress.io/) - End-to-end testing framework

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/bkhsoftware/MOWED/tags).

## Current Development Status

As of version 0.2.4, we have made significant progress in Phase 2 of development:

- Partly implemented and enhanced four initial modules: Personal Finance, Education Resource Allocation, Reforestation Optimization, and Small Business Management
- Developed and integrated shared components (ModuleForm, ResultsDisplay, ChartComponent) across all modules
- Added sample data functionality for easier exploration and testing
- Implemented comprehensive input validation and error handling for all modules
- Enhanced data analysis and visualization capabilities across all modules
- Standardized module interfaces and result structures for better maintainability
- Improved code reusability and consistency across the entire application

Refer to [docs/planning/phase-2-todo-list.md](docs/planning/phase-2-todo-list.md) for the detailed development plan and current priorities.

## Future Plans

We are planning to integrate MOWED with CosmicSyncCore, a P2P platform for decentralized data storage and synchronization. This integration will enable features such as:

- Distributed computing for solving complex optimization problems
- Peer-to-peer data sharing and collaboration
- Enhanced offline capabilities and data synchronization

While these features are not part of the current release, our architecture is designed with future P2P integration in mind.


## Authors

* **Björn Kenneth Holmström** [BjornKennethHolmstrom](https://bjornkennethholmstrom.wordpress.com/)

## License

This project is licensed under a custom License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Claude A.I.
* Friends and family for support and infrastructure
