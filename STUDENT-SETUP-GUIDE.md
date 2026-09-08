# Student setup guide

This is the easiest setup flow for your 30 students.

## 1) Use one default password pattern

Use a simple temporary password formula that is easy to give out:

- ILMNexus2026!
- ILM2026!@student
- IlmNexus@2026

Use the same format for all students, or give each student a unique temporary password if you prefer.

Important:
- Firebase does not let you view a saved password after creation.
- You can create the account with a temporary password and then send a reset link.

## 2) Add each student in Firebase Authentication

Go to:
- Firebase Console
- Authentication
- Users
- Add user

For each student, enter:
- Email: studentname@example.com
- Password: temporary password

## 3) Add their Firestore profile

In Firestore, create a document in the `users` collection.

Required fields:
- name
- email
- username
- course
- campusId
- role: Student
- approvalStatus: APPROVED or PENDING

Example:

```json
{
  "name": "Ada Okafor",
  "email": "ada.okafor@example.com",
  "username": "adaokafor",
  "course": "Front-End Web Development",
  "campusId": "unilorin",
  "role": "Student",
  "approvalStatus": "APPROVED",
  "plan": "Standard",
  "projectReviewStatus": "Not Submitted",
  "certificateStatus": "Not Approved",
  "amountPaid": 0,
  "requiredFee": 45000,
  "outstandingBalance": 45000,
  "paymentStatus": "Payment Pending"
}
```

## 4) Use the admin status dropdown

In the admin panel, change student status to:
- APPROVED = can login
- PENDING = cannot login yet
- SUSPENDED = blocked
- REJECTED = blocked

The login page will block any student whose record is pending, suspended, rejected, or disabled.

## 5) Send password reset if needed

From the admin student list, use the reset link button for a student.

This is the easiest way to give a student access without exposing any password.

## 6) Recommended workflow

For today:
- Create Firebase user
- Create Firestore user document
- Set `approvalStatus` to `PENDING` until the student is checked
- When approved, change to `APPROVED`

This keeps the system controlled and prevents random login.
