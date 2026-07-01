# PulseSync ⚡ | Full-Stack Healthcare Platform

PulseSync is a scalable, high-concurrency clinical operations platform designed to digitize medical record management, automate OPD (Outpatient Department) workflows, and significantly reduce patient waiting times. 

## 🚀 Key Features

* **Thread-Safe Queue Management:** Engineered a robust token generation system using `ConcurrentHashMap` and `AtomicInteger` to handle high-traffic booking scenarios, ensuring data integrity and preventing race conditions during peak hospital hours.
* **Secure Multi-Role Authentication:** Implemented role-based access control (RBAC) with **BCrypt** password hashing for clinical staff and HMAC-SHA256 signature-based OTP verification for patients, ensuring HIPAA-aligned data security.
* **Real-Time Diagnostic Synchronization:** Built a live synchronization module connecting pathology labs directly to doctor dashboards, cutting down report turnaround times and enabling instant digital access for patients.
* **Digital Health Record Integration:** Integrated ABHA (Ayushman Bharat Health Account) onboarding guidelines for portable, unified digital health records, reducing administrative bottlenecks at the reception desk.
* **Smart OPD Console:** A live, auto-refreshing interface for doctors to manage active queues, swap unresponsive patients, and securely log digital prescriptions.

## 🛠️ Tech Stack

**Backend**
* Java (Spring Boot)
* Spring Web / REST APIs
* MongoDB (NoSQL Database)
* BCrypt & HMAC-SHA256 (Cryptography/Security)

**Frontend**
* HTML5 / CSS3
* Vanilla JavaScript (ES6+)
* Asynchronous Fetch API for real-time DOM updates

## ⚙️ Getting Started

### Prerequisites
* Java Development Kit (JDK) 17 or higher
* Maven
* MongoDB installed locally or a MongoDB Atlas cluster URL

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone [https://github.com/yourusername/PulseSync.git](https://github.com/yourusername/PulseSync.git)
   cd PulseSync
