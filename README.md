This project synchronizes users from HubSpot to Firebase Firestore using Node.js, with the synchronization data coming from an Excel file. It implements batch synchronization to efficiently transfer contacts from HubSpot to a Firebase collection.

Features
Batch synchronization of contacts from HubSpot to Firebase using data from an Excel file.
Pagination handling for processing large volumes of contacts.
Environment configuration using .env files for managing sensitive keys and settings.
Designed to run as a Cloud Function in Firebase.
Prerequisites
Node.js (v18 or later).
A Firebase account with a configured project.
A valid HubSpot API Key.
Excel file containing the contact data to synchronize.
Firebase CLI installed:

npm install -g firebase-tools
Installation
Clone this repository:

git clone https://github.com/your-username/JS-Hubspot-Excel-Firebase.git
cd JS-Hubspot-Excel-Firebase
Install dependencies:

npm install
Initialize Firebase in your project:

firebase init functions
Create a .env file in the root directory:

Add the following content to .env:

HUBSPOT_API_KEY=your-hubspot-api-key
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="your-private-key"
EXCEL_FILE_PATH=path-to-your-excel-file.xlsx

Running the Project Locally
To start the Firebase emulators and test the functionality locally, run:

firebase emulators:start
Open your browser and test the endpoint:


http://localhost:5001/<YOUR_PROJECT_ID>/us-central1/syncUsers
Deploy to Firebase
Deploy the functions to Firebase:

firebase deploy --only functions
After deployment, the endpoint will be available. Check the logs for the deployment URL.

Endpoints
Batch Synchronization
Synchronize contacts from HubSpot (via data in Excel) to Firebase Firestore:

GET /syncUsers
Environment Variables
The project uses the following environment variables:

Variable	Description
HUBSPOT_API_KEY	API key to authenticate with HubSpot.
FIREBASE_PROJECT_ID	Firebase project ID.
FIREBASE_CLIENT_EMAIL	Firebase client email.
FIREBASE_PRIVATE_KEY	Private key for Firebase authentication.
EXCEL_FILE_PATH	Path to the Excel file containing the user data.

Dependencies

Node.js

Firebase Admin SDK
Firebase Functions
HubSpot API Client

ExcelJS

dotenv
Contribution
Fork the repository.
Create a new branch:

git checkout -b feature-branch
Commit your changes:

git commit -m "Add new feature"
Push to your branch:

git push origin feature-branch
Open a pull request.

License
This project is licensed under the MIT License.
