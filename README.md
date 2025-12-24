# 🗣️ HearMeOuttt

> **A judgment-free, anonymous space to share thoughts, experiences, and ideas.**

**HearMeOuttt** is a simple, anonymous web application where anyone can share their mind without creating an account. Whether you're feeling happy, confused, thoughtful, or just want to vent, this platform offers a safe public space to be heard.

Unlike typical confession sites, **HearMeOuttt** encourages sharing daily experiences, ideas, and feelings—provided they follow community safety guidelines.

---

## 🔗 Quick Links

- 🌍 **Live Preview:** [hearmeouttt.netlify.app](https://hearmeouttt.netlify.app)
- 📂 **Source Code:** [github.com/Harshvdev/HearMeOut](https://github.com/Harshvdev/HearMeOut)

---

## ✨ Features

- **📝 Anonymous Posting:** Share thoughts with word and character limits. No account required.
- **🛡️ Community Safety:**
  - **Smart Cooldown:** A 5-minute posting delay per user to prevent spam.
  - **Auto-Moderation:** Posts receiving **3+ reports** are automatically hidden from the feed.
- **🌙 Dark Mode:** Fully supported with a toggle switch.
- **⚡ Real-Time Feed:** Powered by Firestore for instant updates.
- **📅 Human-Readable Timestamps:** Clear timing for every post.
- **📱 Responsive Design:** Optimized for both mobile and desktop experiences.
- **🛠️ Feedback System:** Built-in modal to report bugs or suggest improvements.

---

## 🧱 Architecture & Tech Stack

This project focuses on designing, building, and deploying a real-world web product with attention to usability and reliability.

### **Tech Stack**
- **Frontend:** HTML5, CSS3 (Modern Variables), JavaScript (Vanilla ES6+)
- **Build Tool:** Vite
- **Backend/DB:** Firebase Firestore (Modular SDK v9+)
- **Hosting:** Netlify

### **Architecture**
The app runs fully client-side. Firestore handles real-time data synchronization and enforces logic (like report thresholds) via database rules.

---

## 🚀 How to Run Locally

If you want to explore the code or contribute, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/Harshvdev/HearMeOut.git
cd HearMeOut
```
### 2. Install dependencies

```bash
npm install
```
### 3. Configure Environment Variables

Create a .env file in the root directory and add your Firebase credentials:

```env
VITE_API_KEY=your_api_key
VITE_AUTH_DOMAIN=your_auth_domain
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_storage_bucket
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_ID=your_app_id
```

### 4. Start the development server

```bash
npm run dev
```
### 🧠 Development Notes

This project was built using AI-assisted development alongside official documentation.

The primary focus was on:

- **Product Design:** Creating a seamless, anonymous user flow  
- **Security Logic:** Implementing rate limiting and moderation thresholds  
- **Real-world Deployment:** Managing environment configurations and production builds  


## 🙋‍♂️ Creator

**Harsh Vardhan Shukla**  
🌐 GitHub: https://github.com/Harshvdev  

Open to feedback, suggestions, and thoughtful collaboration.

## 🛡️ License

This repository is shared publicly for learning, transparency, and demonstration purposes.

⛔ Commercial use, redistribution, or public cloning of this exact project without permission is not allowed.

If you’re interested in collaboration or licensed use, feel free to reach out.

© 2025 Harsh Vardhan Shukla. All rights reserved.