# LifeDash - AI-Powered Job & Productivity Tracker

**Live Demo:** [**https://life-dash-psi.vercel.app//**](https://life-dash-psi.vercel.app)

As this app requests Google permissions, and it is not a verified production piece, I have to manually verify emails. Therefore, please log in with the following credentials:

Email: lifedashtest@gmail.com \
Password: GuestPass200!

Then, if you would like to test the sync feature, send a dummy email about a job application to the above email address and hit sync! Please note, the backend server is hosted on a free tier service so may take some minutes to spin up in order to login.


## About The Project

LifeDash is a full-stack web application designed to be a central hub for personal productivity and job searching. I built this project to solve a personal problem: the difficulty of tracking job applications, managing daily tasks, and staying organized during the job hunt. 

The standout feature is an AI-powered Gmail sync that automatically scans for emails related to job applications, uses a language model to interpret their content, and intelligently creates or updates application records in the user's dashboard.

This project was built from scratch and demonstrates a full range of modern web development skills, from a secure RESTful API back-end to a responsive React front-end, all deployed on a live production environment.

![LifeDash App Demo GIF](./life-dash-demo.gif)

---

### Tech Stack

This project is built with the MERN stack and leverages several modern technologies:

| Front-End | Back-End | Database | AI / APIs | Deployment |
| :---: | :---: | :---: | :---: | :---: |
| ![React](https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=white) | ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white) | ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?logo=postgresql&logoColor=white) | ![Hugging Face](https://img.shields.io/badge/🤗%20Hugging%20Face-API-yellow) | ![Vercel](https://img.shields.io/badge/-Vercel-black?logo=vercel&logoColor=white) |
| ![Chakra UI](https://img.shields.io/badge/-Chakra%20UI-319795?logo=chakraui&logoColor=white) | ![Express](https://img.shields.io/badge/-Express-black?logo=express&logoColor=white) | ![Prisma](https://img.shields.io/badge/-Prisma-2D3748?logo=prisma&logoColor=white) | ![Google API](https://img.shields.io/badge/-Google%20API-4285F4?logo=google&logoColor=white) | ![Render](https://img.shields.io/badge/-Render-46E3B7?logo=render&logoColor=white) |

---

### Features

*   **Secure User Authentication:** Full JWT-based authentication flow with hashed passwords.
*   **Task Management:** A full CRUD interface for creating, reading, updating, and deleting daily tasks.
*   **Intelligent Job Tracker:** 
    *   Manually add, edit, and delete job applications.
    *   Expandable rows to view the interaction history for each application.
*   **AI-Powered Gmail Sync:**
    *   Securely connect a Google account using OAuth 2.0.
    *   On-demand sync scans for recent, relevant job application emails.
    *   Uses a Hugging Face language model to classify emails and extract key data (company name, status, next steps).
    *   Intelligently creates new applications or updates existing ones, preventing duplicates.

---
