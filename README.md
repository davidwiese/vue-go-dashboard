# Trackify Fleet (Frontend)

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Live Demo
[trackifyfleet.pro](https://trackifyfleet.pro)

## Project Overview
**Trackify Fleet** is a real-time vehicle tracking application built with Vue.js and integrated with the OneStep GPS API. The dashboard provides real-time vehicle tracking, customizable preferences, and detailed reporting capabilities.

## Technologies Used
- **Frontend Framework:**
  - Vue 3 with Composition API
  - TypeScript
  - Vuetify 3
  - Google Maps API

- **State Management & Real-time Updates:**
  - Vue Reactive State
  - WebSocket Integration
  - Optimistic Updates with Error Recovery

- **Deployment:**
  - AWS S3
  - CloudFront with HTTPS
  - Custom Domain Configuration

## Features

### Real-Time Vehicle Tracking
- Live vehicle position updates via WebSocket
- Dynamic map markers with detailed vehicle information
- Status indicators (online/offline, moving/stationary)

### Customizable Preferences
- Drag-and-drop vehicle reordering
- Show/hide individual vehicles
- Custom vehicle names
- Alphabetical sorting
- Persistent preferences stored in database

### Vehicle Reports
- Generate detailed activity reports
- Multiple time range options:
  - Last 24 hours
  - Last 7 days
  - Last 30 days
- Automatic report generation and download

### Responsive Design
- Optimized for all screen sizes
- Adaptive layout for mobile and desktop
- Touch-friendly interactions

## Component Structure
- **HomeView:** Main dashboard container
  - **MapView:** Google Maps integration with vehicle markers
  - **VehicleList:** List of vehicle cards with status
    - **VehicleCard:** Individual vehicle display
    - **VehiclePreferences:** Preference management dialog
    - **ReportDialog:** Report generation interface
   
## Future Improvements
- Enhanced map features (route tracking, geofencing)
- Additional report types and formats
- Advanced filtering and search capabilities
- Real-time notifications and alerts
- Enhanced mobile optimization

## License
This project is licensed under the [MIT License](LICENSE).

## Related Repositories
- [Backend Repository](https://github.com/davidwiese/vue-go-backend)
