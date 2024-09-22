# Unit Test Checklist

## Core Components
- [X] ModuleInterface
- [X] ModuleRegistry
- [x] EventBus
- [x] IndexedDBAdapter

## Modules
- [x] PersonalFinance
- [x] Education
- [x] Reforestation
- [x] SmallBusiness

## Vue Components
- [x] App.vue
- [x] OnlineStatus.vue
- [x] ModuleSelector.vue
- [x] ModuleForm.vue

## Vuex Store
- [X] State (partially)
- [X] Mutations (partially)
- [X] Actions (partially)
- [X] Getters (partially)

## Utility Functions
- [x] Any helper functions in `utils/` directory

## Service Worker
- [x] Basic functionality tests

## Integration Tests
- [ ] Module registration and retrieval
- [ ] Data persistence (IndexedDB)
- [ ] Offline functionality

## End-to-End Tests
- [ ] Complete user flow for each module
- [ ] Offline usage scenario
