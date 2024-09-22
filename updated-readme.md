# MOWED (Mathematical Optimization With End-user Devices)

MOWED is a web-based application that brings the power of mathematical optimization to end-users, making it accessible and user-friendly for various applications.

## Tagline

"MOWED: Mowing down inequalities"

## Description

MOWED aims to democratize access to optimization tools, bridging the gap between optimization experts and the general public. It provides a user-friendly interface for various optimization problems, including personal finance management, education resource allocation, reforestation planning, and small business optimization.

## Features

- Modular architecture for easy addition of new optimization problems
- Multiple optimization modules: Personal Finance, Education, Reforestation, and Small Business
- Data persistence using browser storage (localStorage and IndexedDB)
- Offline capabilities with background sync (PWA)
- Interactive UI with real-time optimization results
- Visualization of results using Chart.js
- State management with Vuex
- Responsive design for various device sizes

## Technical Stack

### Frontend
- **Framework**: Vue.js 3
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

## Getting Started

[No changes to this section]

## Running Tests

- To run unit tests:
  ```
  npm run test:unit
  ```
- To run end-to-end tests:
  ```
  npm run test:e2e
  ```

## Future Plans

We are planning to integrate MOWED with CosmicSyncCore, a P2P platform for decentralized data storage and synchronization. This integration will enable features such as:

- Distributed computing for solving complex optimization problems
- Peer-to-peer data sharing and collaboration
- Enhanced offline capabilities and data synchronization

While these features are not part of the current release, our architecture is designed with future P2P integration in mind.

[Rest of the README remains unchanged]
