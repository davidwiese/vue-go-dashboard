# Vue Go Fleet Tracking Dashboard

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## **Table of Contents**
- [Project Overview](#project-overview)
- [Technologies Used](#technologies-used)
- [Features](#features)
- [Learning Journey](#learning-journey)
- [Installation](#installation)
- [Usage](#usage)
- [Future Improvements](#future-improvements)
- [Contributing](#contributing)
- [License](#license)

## **Project Overview**
The **Vue Go Fleet Tracking Dashboard** is a real-time vehicle tracking application developed to demonstrate proficiency in modern frontend technologies and cloud deployment. Built using **Vue.js** with the **Vuetify** UI library, the dashboard integrates real-time data updates via **WebSockets** and dynamic mapping with **Leaflet**. The application is deployed on **AWS S3** for the frontend and **Elastic Beanstalk** for the backend, utilizing an **RDS MySQL** database.

This project was developed over a few days to showcase the ability to rapidly learn and implement new technologies, aligning with the requirements of dynamic and fast-paced development environments.

## **Technologies Used**
- **Frontend:**
  - [Vue.js](https://vuejs.org/) - Progressive JavaScript framework for building user interfaces.
  - [Vuetify](https://vuetifyjs.com/) - Material Design component framework for Vue.js.
  - [Leaflet](https://leafletjs.com/) - Open-source JavaScript library for interactive maps.
  - **WebSockets** - For real-time data communication.
  
- **Backend:**
  - [Go](https://golang.org/) - Statically typed, compiled programming language designed at Google.
  
- **Database:**
  - [MySQL](https://www.mysql.com/) - Relational database management system.
  
- **Deployment:**
  - [AWS S3](https://aws.amazon.com/s3/) - Object storage service for the frontend.
  - [AWS Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk/) - Platform as a Service (PaaS) for the backend.
  - [AWS RDS](https://aws.amazon.com/rds/) - Managed relational database service.

## **Features**
- **Real-Time Vehicle Tracking:**
  - Utilizes WebSockets to receive instant updates on vehicle statuses and locations.
  
- **Interactive Mapping:**
  - Integrates Leaflet for dynamic and responsive map displays, allowing users to visualize vehicle movements in real-time.
  
- **CRUD Operations:**
  - Create, Read, Update, and Delete functionalities for managing vehicle information.
  
- **Responsive Design:**
  - Built with Vuetify to ensure a consistent and responsive user interface across various devices and screen sizes.
  
- **Cloud Deployment:**
  - Frontend hosted on AWS S3 for scalability and reliability.
  - Backend deployed on AWS Elastic Beanstalk with a MySQL database managed through AWS RDS.

## **Learning Journey**
Embarking on this project provided a hands-on opportunity to delve into technologies that were new to me, particularly **Vue.js** and **Go**. The rapid development cycle required me to:
- **Master Vue.js and Vuetify:**
  - Leveraged Vue's reactive data binding and component-based architecture to build a modular and maintainable frontend.
  - Utilized Vuetify's extensive component library to accelerate UI development and ensure adherence to Material Design principles.
  
- **Implement Real-Time Features with WebSockets:**
  - Established a WebSocket connection to handle live data streams, enhancing the application's interactivity and responsiveness.
  
- **Integrate Leaflet for Mapping:**
  - Configured Leaflet to display interactive maps, enabling real-time visualization of vehicle locations.
  
- **Deploy Applications on AWS:**
  - Gained practical experience with AWS services, deploying the frontend on S3 and the backend on Elastic Beanstalk, ensuring seamless integration and scalability.
  
- **Database Management with MySQL:**
  - Designed and managed a relational database schema to store and retrieve vehicle data efficiently.

This project not only solidified my understanding of these technologies but also honed my ability to learn and apply new tools swiftly—a crucial skill for thriving in dynamic development environments.

## **Installation**
To run the **Vue Go Fleet Tracking Dashboard** locally, follow these steps:

### **Prerequisites**
- **Node.js** and **npm** installed. Download from [Node.js Official Website](https://nodejs.org/).
- **Go** installed. Download from [Go Official Website](https://golang.org/dl/).
- **MySQL** database set up (locally or via AWS RDS).

### **Frontend Setup**
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/davidwiese/vue-go-dashboard.git
