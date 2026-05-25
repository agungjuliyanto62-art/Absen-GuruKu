# Security Specification for Firebase Integration

## Data Invariants
1. A user can only read/write their own personal data (attendance, requests, reminders).
2. Admin users can read and update all records to approve/reject requests.
3. Posts can be read by any authenticated user.
4. School settings and profile can only be modified by admins.
5. All IDs must follow the format `^[a-zA-Z0-9_\-]+$`.
6. Timestamps for creation/update should be validated.

## The "Dirty Dozen" Payloads
1. Attempt to update another user's employeeId.
2. Attempt to create an attendance record for a future date.
3. Attempt to approve your own leave request.
4. Attempt to delete another user's post.
5. Attempt to modify school settings without admin role.
6. Attempt to inject a 1MB string into the locationName field.
7. Attempt to create a post with a fake author UID.
8. Attempt to read other users' private profiles.
9. Attempt to change a approved leave request back to pending.
10. Attempt to spoof a server timestamp.
11. Attempt to create a user with "admin" role directly.
12. Attempt to bypass size limits on news content.

## The Test Runner
(Tests would be implemented in `firestore.rules.test.ts` if a testing environment were available. For this turn, we focus on the rules logic).
