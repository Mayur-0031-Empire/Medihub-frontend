# MediHub Frontend API Guide

This frontend is separate from the MediHub backend repository. The backend server URL must be stored in this frontend project's own `.env` file.

## Environment Setup

Create a `.env` file inside the `frontend` folder:

```env
MEDIHUB_SERVER=https://your-medihub-backend-url.com
```

Use it in frontend API calls like:

```js
const server = process.env.MEDIHUB_SERVER;
const response = await fetch(`${server}/api/health`);
```

If your frontend uses Vite, environment variables must start with `VITE_`:

```env
VITE_MEDIHUB_SERVER=https://your-medihub-backend-url.com
```

Vite usage:

```js
const server = import.meta.env.VITE_MEDIHUB_SERVER;
```

If your frontend uses Next.js and the value must be available in browser code:

```env
NEXT_PUBLIC_MEDIHUB_SERVER=https://your-medihub-backend-url.com
```

Do not add backend secret keys in frontend `.env`. Frontend should only store the backend server URL and public browser-only keys if needed.

## Common Response Format

Most successful API responses follow this shape:

```json
{
  "statusCode": 200,
  "message": "Success message",
  "data": {},
  "success": true
}
```

Error responses usually follow this shape:

```json
{
  "success": false,
  "message": "Error message",
  "errors": []
}
```

For protected routes, login cookies are used automatically if frontend requests include credentials:

```js
fetch(`${server}/api/users/me`, {
  credentials: "include"
});
```

## Public APIs

### Health Check

`GET <process.env.MEDIHUB_SERVER>/api/health`

- Request type: `GET`
- Required parameters: none
- Optional parameters: none
- Request body: none
- Auth required: no
- What it does: checks whether backend server is running.
- Response type: JSON

Response:

```json
{
  "status": "ok",
  "service": "medihub-api"
}
```

### BMI Buddy Info

`GET <process.env.MEDIHUB_SERVER>/api/bmi-buddy`

- Request type: `GET`
- Required parameters: none
- Optional parameters: none
- Request body: none
- Auth required: no
- What it does: returns short BMI meaning, required BMI parameters, and BMI categories.
- Response type: JSON document

Response data contains:

```json
{
  "meaning": "BMI means Body Mass Index...",
  "requiredParameters": [],
  "categories": []
}
```

### Calculate BMI

`POST <process.env.MEDIHUB_SERVER>/api/bmi-buddy/calculate`

- Request type: `POST`
- Required body: `heightCm`, `weightKg`
- Optional body: none
- Auth required: no
- Content type: `application/json`
- What it does: calculates BMI and returns diet, workout, and lifestyle plans.
- Response type: JSON document

Request:

```json
{
  "heightCm": 170,
  "weightKg": 82
}
```

Response data contains:

```json
{
  "bmi": 28.4,
  "category": "Overweight",
  "categoryKey": "overweight",
  "note": "BMI is a screening guide...",
  "plans": {
    "dietPlan": [],
    "workoutPlan": [],
    "lifestylePlan": []
  }
}
```

### Public Verified Doctors

`GET <process.env.MEDIHUB_SERVER>/api/doctors`

- Request type: `GET`
- Required parameters: none
- Optional query parameters: `title`
- Auth required: no
- What it does: gets public verified doctor profiles.
- Response type: JSON document

Example:

```txt
<process.env.MEDIHUB_SERVER>/api/doctors?title=Cardiology
```

Response data contains an array of doctor profiles:

```json
[
  {
    "_id": "doctorProfileId",
    "specialization": "Cardiologist",
    "experienceYears": 8,
    "hospitalName": "City Care Hospital",
    "consultationFee": 700,
    "availabilitySchedule": "Mon-Fri",
    "verifiedTitles": [],
    "user": {
      "firstName": "Asha",
      "lastName": "Sharma",
      "email": "asha@example.com",
      "phone": "+919999999999",
      "photo": "https://..."
    }
  }
]
```

### Doctor Available Slots

`GET <process.env.MEDIHUB_SERVER>/api/appointments/doctors/:doctorProfileId/slots`

- Request type: `GET`
- Required path parameter: `doctorProfileId`
- Optional query parameters: `from`, `to`
- Auth required: no
- What it does: returns available slots for a verified doctor.
- Response type: JSON document

Example:

```txt
<process.env.MEDIHUB_SERVER>/api/appointments/doctors/doctorProfileId/slots?from=2026-05-10T00:00:00.000Z&to=2026-05-11T00:00:00.000Z
```

Response data contains:

```json
[
  {
    "_id": "slotId",
    "doctorProfile": "doctorProfileId",
    "doctor": "doctorUserId",
    "startAt": "2026-05-10T10:00:00.000Z",
    "endAt": "2026-05-10T10:30:00.000Z",
    "status": "available"
  }
]
```

### Nearby Hospital Locator

`GET <process.env.MEDIHUB_SERVER>/api/hospital-locator/nearby`

- Request type: `GET`
- Required query parameters: `latitude`, `longitude`, `rangeKm`
- Optional query parameters: `specialty`, `maxResultCount`
- Auth required: no
- What it does: fetches nearby real hospitals from Google Places through the backend.
- Response type: JSON document

Example:

```txt
<process.env.MEDIHUB_SERVER>/api/hospital-locator/nearby?latitude=12.9716&longitude=77.5946&rangeKm=5&specialty=Cardiology
```

Response data contains:

```json
{
  "currentLocation": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "rangeKm": 5,
  "map": {
    "provider": "google_maps",
    "center": {
      "latitude": 12.9716,
      "longitude": 77.5946
    },
    "zoom": 12
  },
  "source": "google_places",
  "hospitals": [
    {
      "placeId": "googlePlaceId",
      "name": "Hospital Name",
      "profilePicture": "https://backend/api/hospital-locator/photo?name=...",
      "address": "Hospital address",
      "phone": "+91...",
      "specialties": [],
      "consultations": [],
      "latitude": 12.97,
      "longitude": 77.59,
      "distanceKm": 2.4,
      "googleMapsUri": "https://maps.google.com/...",
      "websiteUri": "https://...",
      "source": "google_places"
    }
  ]
}
```

### Hospital Map Config

`GET <process.env.MEDIHUB_SERVER>/api/hospital-locator/map-config`

- Request type: `GET`
- Required parameters: none
- Optional parameters: none
- Auth required: no
- What it does: returns non-secret map configuration.
- Response type: JSON document

Response data contains:

```json
{
  "mapId": "",
  "libraries": ["maps", "marker", "places"],
  "defaultCenter": {
    "latitude": 20.5937,
    "longitude": 78.9629
  },
  "defaultZoom": 12,
  "hasBrowserMapKey": false,
  "provider": "google_maps"
}
```

### Hospital Photo

`GET <process.env.MEDIHUB_SERVER>/api/hospital-locator/photo`

- Request type: `GET`
- Required query parameter: `name`
- Optional query parameters: `maxWidthPx`, `maxHeightPx`
- Auth required: no
- What it does: redirects to a Google Places hospital photo.
- Response type: redirect/image

Example:

```txt
<process.env.MEDIHUB_SERVER>/api/hospital-locator/photo?name=places/placeId/photos/photoId&maxWidthPx=700
```

### Local Hospital List

`GET <process.env.MEDIHUB_SERVER>/api/hospital-locator/hospitals`

- Request type: `GET`
- Required parameters: none
- Optional query parameters: `search`, `specialty`
- Auth required: no
- What it does: lists locally stored hospital profiles from MongoDB.
- Response type: JSON document

### Create Local Hospital

`POST <process.env.MEDIHUB_SERVER>/api/hospital-locator/hospitals`

- Request type: `POST`
- Required body: `name`, `address`, `phone`, `latitude`, `longitude`
- Optional body: `profilePicture`, `specialties`, `consultations`
- Auth required: no
- Content type: `application/json`
- What it does: creates a local hospital profile in MongoDB.
- Response type: JSON document

Request:

```json
{
  "name": "City Care Hospital",
  "profilePicture": "https://example.com/photo.jpg",
  "address": "MG Road, Bengaluru",
  "phone": "+919876543210",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "specialties": ["Cardiology", "Emergency"],
  "consultations": ["OPD", "Emergency care"]
}
```

## Authentication APIs

### Register

`POST <process.env.MEDIHUB_SERVER>/api/auth/register`

- Request type: `POST`
- Required fields: `firstName`, `lastName`, `username`, `role`, `email`, `phone`, `password`, `confirmPassword`, `photo`
- Optional fields: none
- Auth required: no
- Content type: `multipart/form-data`
- What it does: creates user account, uploads photo, and sets auth cookies.
- Response type: JSON document

Form data:

```txt
firstName: Asha
lastName: Sharma
username: asha_sharma
role: patient
email: asha@example.com
phone: +919999999999
password: StrongPass123
confirmPassword: StrongPass123
photo: choose file
```

Response data contains user object:

```json
{
  "_id": "userId",
  "firstName": "Asha",
  "lastName": "Sharma",
  "username": "asha_sharma",
  "role": "patient",
  "email": "asha@example.com",
  "phone": "+919999999999",
  "photo": "https://..."
}
```

Password is not returned.

### Login

`POST <process.env.MEDIHUB_SERVER>/api/auth/login`

- Request type: `POST`
- Required body: `password` and one of `identifier`, `usernameOrEmail`, `username`, or `email`
- Optional body: none
- Auth required: no
- Content type: `application/json`
- What it does: logs user in and sets HTTP-only auth cookies.
- Response type: JSON document

Request:

```json
{
  "identifier": "asha@example.com",
  "password": "StrongPass123"
}
```

Response data contains user object.

### Refresh Token

`POST <process.env.MEDIHUB_SERVER>/api/auth/refresh`

- Request type: `POST`
- Required data: refresh token cookie
- Optional body: `refreshToken`
- Auth required: refresh token required
- What it does: issues new access and refresh tokens.
- Response type: JSON document

### Logout

`POST <process.env.MEDIHUB_SERVER>/api/auth/logout`

- Request type: `POST`
- Required data: refresh token cookie or body `refreshToken`
- Optional data: none
- Auth required: session token
- What it does: clears saved refresh token and auth cookies.
- Response type: JSON document

## Protected User APIs

Use:

```js
fetch(`${server}/api/users/me`, {
  credentials: "include"
});
```

### Get My Profile

`GET <process.env.MEDIHUB_SERVER>/api/users/me`

- Request type: `GET`
- Required data: logged-in user cookie
- Optional data: none
- Auth required: yes
- What it does: returns current logged-in user.
- Response type: JSON document

### Update My Profile

`PATCH <process.env.MEDIHUB_SERVER>/api/users/me`

- Request type: `PATCH`
- Required body: at least one editable field
- Optional body: `firstName`, `lastName`, `phone`, `gender`, `address`, `bloodGroup`, `age`
- Auth required: yes
- Content type: `application/json`
- What it does: updates allowed user profile fields.
- Response type: JSON document

### Update Profile Photo

`PATCH <process.env.MEDIHUB_SERVER>/api/users/me/photo`

- Request type: `PATCH`
- Required form-data field: `photo`
- Optional fields: none
- Auth required: yes
- Content type: `multipart/form-data`
- What it does: uploads and updates profile photo.
- Response type: JSON document

### Update Password

`PATCH <process.env.MEDIHUB_SERVER>/api/users/me/password`

- Request type: `PATCH`
- Required body: `oldPassword`, `newPassword`, `confirmPassword`
- Optional body: none
- Auth required: yes
- Content type: `application/json`
- What it does: changes logged-in user's password.
- Response type: JSON document

## Doctor APIs

### My Doctor Profile

`GET <process.env.MEDIHUB_SERVER>/api/doctors/me`

- Request type: `GET`
- Required data: logged-in doctor cookie
- Optional data: none
- Auth required: yes, doctor role
- What it does: gets logged-in doctor's profile.
- Response type: JSON document

### Create Doctor Profile

`POST <process.env.MEDIHUB_SERVER>/api/doctors/me`

- Request type: `POST`
- Required fields: `specialization`, `experienceYears`, `hospitalName`, `consultationFee`, `availabilitySchedule`, `documentTitles`, `documents`
- Optional fields: none
- Auth required: yes, doctor role
- Content type: `multipart/form-data`
- What it does: creates doctor profile with qualification documents.
- Response type: JSON document

### Update Doctor Profile

`PATCH <process.env.MEDIHUB_SERVER>/api/doctors/me`

- Request type: `PATCH`
- Required body: at least one editable field
- Optional body: `specialization`, `experienceYears`, `hospitalName`, `consultationFee`, `availabilitySchedule`
- Auth required: yes, doctor role
- Content type: `application/json`
- What it does: updates doctor profile.
- Response type: JSON document

### Add Doctor Documents

`POST <process.env.MEDIHUB_SERVER>/api/doctors/me/documents`

- Request type: `POST`
- Required fields: `documentTitles`, `documents`
- Optional fields: none
- Auth required: yes, doctor role
- Content type: `multipart/form-data`
- What it does: adds more qualification documents.
- Response type: JSON document

### Admin Pending Doctors

`GET <process.env.MEDIHUB_SERVER>/api/doctors/admin/pending`

- Request type: `GET`
- Required data: admin login cookie
- Optional data: none
- Auth required: yes, admin role
- What it does: lists doctors waiting for document verification.
- Response type: JSON document

### Admin Verify Doctor

`PATCH <process.env.MEDIHUB_SERVER>/api/doctors/admin/:doctorProfileId/verify`

- Request type: `PATCH`
- Required path parameter: `doctorProfileId`
- Required body: `verificationStatus`
- Optional body: `documentIds`, `rejectionReason`, `isRecommended`
- Auth required: yes, admin role
- Content type: `application/json`
- What it does: verifies or rejects doctor documents.
- Response type: JSON document

Request:

```json
{
  "verificationStatus": "verified",
  "documentIds": ["documentId"],
  "isRecommended": true
}
```

## Appointment APIs

### Create Doctor Slots

`POST <process.env.MEDIHUB_SERVER>/api/appointments/slots`

- Request type: `POST`
- Required body: `slots`
- Optional body: none
- Auth required: yes, verified doctor
- Content type: `application/json`
- What it does: creates availability slots.
- Response type: JSON document

Request:

```json
{
  "slots": [
    {
      "startAt": "2026-05-10T10:00:00.000Z",
      "endAt": "2026-05-10T10:30:00.000Z"
    }
  ]
}
```

### Book Appointment

`POST <process.env.MEDIHUB_SERVER>/api/appointments/book`

- Request type: `POST`
- Required body: `slotId`
- Optional body: `symptoms`, `patientNotes`, `trainingConsent`
- Auth required: yes, patient role
- Content type: `application/json`
- What it does: books appointment and creates notification records.
- Response type: JSON document

### My Appointments

`GET <process.env.MEDIHUB_SERVER>/api/appointments/me`

- Request type: `GET`
- Required data: logged-in cookie
- Optional data: none
- Auth required: yes
- What it does: returns appointments for current patient, doctor, or admin.
- Response type: JSON document

### Appointment Details

`GET <process.env.MEDIHUB_SERVER>/api/appointments/:appointmentId`

- Request type: `GET`
- Required path parameter: `appointmentId`
- Optional data: none
- Auth required: yes
- What it does: returns one appointment if user has access.
- Response type: JSON document

### Add Patient Symptoms

`PATCH <process.env.MEDIHUB_SERVER>/api/appointments/:appointmentId/symptoms`

- Request type: `PATCH`
- Required path parameter: `appointmentId`
- Optional body: `symptoms`, `patientNotes`
- Auth required: yes, patient role
- Content type: `application/json`
- What it does: adds symptoms and patient notes.
- Response type: JSON document

### Upload Patient Reports

`POST <process.env.MEDIHUB_SERVER>/api/appointments/:appointmentId/reports`

- Request type: `POST`
- Required path parameter: `appointmentId`
- Required form-data field: `reports`
- Optional field: `titles`
- Auth required: yes, patient role
- Content type: `multipart/form-data`
- What it does: uploads patient medical reports.
- Response type: JSON document

### Update Doctor Notes

`PATCH <process.env.MEDIHUB_SERVER>/api/appointments/:appointmentId/doctor-notes`

- Request type: `PATCH`
- Required path parameter: `appointmentId`
- Optional body: `doctorDiagnosis`, `doctorNotes`, `meetingTranscript`, `status`
- Auth required: yes, doctor role
- Content type: `application/json`
- What it does: updates doctor consultation notes.
- Response type: JSON document

### Upload Doctor Files

`POST <process.env.MEDIHUB_SERVER>/api/appointments/:appointmentId/doctor-files`

- Request type: `POST`
- Required path parameter: `appointmentId`
- Required form-data field: `files`
- Optional field: `titles`
- Auth required: yes, doctor role
- Content type: `multipart/form-data`
- What it does: uploads doctor consultation files.
- Response type: JSON document

### Generate AI Draft

`POST <process.env.MEDIHUB_SERVER>/api/appointments/:appointmentId/ai-draft`

- Request type: `POST`
- Required path parameter: `appointmentId`
- Optional body: none
- Auth required: yes, doctor role
- What it does: generates AI consultation notes and prescription draft.
- Response type: JSON document

### Approve Prescription

`PATCH <process.env.MEDIHUB_SERVER>/api/appointments/:appointmentId/prescription/approve`

- Request type: `PATCH`
- Required path parameter: `appointmentId`
- Required body: `approvedText`
- Optional body: none
- Auth required: yes, doctor role
- Content type: `application/json`
- What it does: saves final doctor-approved prescription.
- Response type: JSON document

### Cancel Appointment By Doctor

`PATCH <process.env.MEDIHUB_SERVER>/api/appointments/:appointmentId/cancel-by-doctor`

- Request type: `PATCH`
- Required path parameter: `appointmentId`
- Optional body: `reason`
- Auth required: yes, doctor role
- Content type: `application/json`
- What it does: cancels appointment and queues notifications.
- Response type: JSON document

### Notifications

`GET <process.env.MEDIHUB_SERVER>/api/appointments/notifications`

- Request type: `GET`
- Required data: logged-in cookie
- Optional data: none
- Auth required: yes
- What it does: lists current user's appointment notifications.
- Response type: JSON document

## AI Chat APIs

### List Chats

`GET <process.env.MEDIHUB_SERVER>/api/ai/chats`

- Request type: `GET`
- Required data: logged-in cookie
- Optional data: none
- Auth required: yes
- What it does: lists user's AI chats.
- Response type: JSON document

### Create Chat

`POST <process.env.MEDIHUB_SERVER>/api/ai/chats`

- Request type: `POST`
- Required body: none
- Optional body: `title`
- Auth required: yes
- Content type: `application/json`
- What it does: creates AI chat session.
- Response type: JSON document

### Send Message And Create Chat

`POST <process.env.MEDIHUB_SERVER>/api/ai/chats/messages`

- Request type: `POST`
- Required data: `message` or `attachments`
- Optional data: `attachments`
- Auth required: yes
- Content type: `application/json` for text only, `multipart/form-data` for attachments
- What it does: sends message to AI and creates a chat if needed.
- Response type: JSON document

### Send Message To Existing Chat

`POST <process.env.MEDIHUB_SERVER>/api/ai/chats/:chatId/messages`

- Request type: `POST`
- Required path parameter: `chatId`
- Required data: `message` or `attachments`
- Optional data: `attachments`
- Auth required: yes
- Content type: `application/json` or `multipart/form-data`
- What it does: sends message to existing AI chat.
- Response type: JSON document

### Get Chat

`GET <process.env.MEDIHUB_SERVER>/api/ai/chats/:chatId`

- Request type: `GET`
- Required path parameter: `chatId`
- Optional data: none
- Auth required: yes
- What it does: gets one owned chat.
- Response type: JSON document

### Rename Chat

`PATCH <process.env.MEDIHUB_SERVER>/api/ai/chats/:chatId`

- Request type: `PATCH`
- Required path parameter: `chatId`
- Required body: `title`
- Optional body: none
- Auth required: yes
- What it does: renames one owned chat.
- Response type: JSON document

### Delete Chat

`DELETE <process.env.MEDIHUB_SERVER>/api/ai/chats/:chatId`

- Request type: `DELETE`
- Required path parameter: `chatId`
- Optional data: none
- Auth required: yes
- What it does: deletes one owned chat.
- Response type: JSON document

## WebRTC Socket.IO

Socket.IO server:

```txt
<process.env.MEDIHUB_SERVER>
```

### Connect

- Required data: `accessToken` cookie or Socket.IO auth token
- Optional data: none
- Auth required: yes
- What it does: connects user to WebRTC signaling server.

Example:

```js
const socket = io(process.env.MEDIHUB_SERVER, {
  withCredentials: true
});
```

Or:

```js
const socket = io(process.env.MEDIHUB_SERVER, {
  auth: {
    token: accessToken
  }
});
```

### Join Consultation

Event:

```txt
consultation:join
```

- Required payload: `appointmentId`
- Optional payload: none
- Output: acknowledgement object

Payload:

```json
{
  "appointmentId": "appointmentId"
}
```

Response:

```json
{
  "ok": true,
  "roomName": "appointment:appointmentId",
  "socketId": "socketId"
}
```

### WebRTC Signaling Events

Events:

- `webrtc:offer`
- `webrtc:answer`
- `webrtc:ice-candidate`
- `consultation:leave`

Required payload for offer:

```json
{
  "appointmentId": "appointmentId",
  "offer": {
    "type": "offer",
    "sdp": "..."
  }
}
```

Required payload for answer:

```json
{
  "appointmentId": "appointmentId",
  "answer": {
    "type": "answer",
    "sdp": "..."
  }
}
```

Required payload for ICE candidate:

```json
{
  "appointmentId": "appointmentId",
  "candidate": {
    "candidate": "...",
    "sdpMid": "0",
    "sdpMLineIndex": 0
  }
}
```

## Frontend Request Notes

For JSON requests:

```js
fetch(`${server}/api/bmi-buddy/calculate`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    heightCm: 170,
    weightKg: 82
  })
});
```

For protected requests using cookies:

```js
fetch(`${server}/api/users/me`, {
  method: "GET",
  credentials: "include"
});
```

For file upload:

```js
const formData = new FormData();
formData.append("photo", file);

fetch(`${server}/api/users/me/photo`, {
  method: "PATCH",
  credentials: "include",
  body: formData
});
```

Do not manually set `Content-Type` when sending `FormData`. The browser sets the correct boundary automatically.

## Sensitive Data Rules

- Do not store backend secrets in frontend `.env`.
- Do not expose `GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`, `CLOUDINARY_API_SECRET`, JWT secrets, or MongoDB URI in frontend.
- Frontend may store only the backend server URL and public browser keys.
- Password is sent only during register, login, and password update.
- Uploaded medical files are sent to backend, uploaded to Cloudinary, and stored as URLs in MongoDB.
