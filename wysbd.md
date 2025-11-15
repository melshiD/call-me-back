- Mention about making sure timezones are heeded (perhaps implement as a timer function for safety) to make sure the scheduled calls at the correct, expected time.
- build simple set of routines for Claude to follow EVERYTIME it wants to do something (like DONT EXPOSE KEYS OR SECRETS in your logs)



PUNCHLIST!:
Authentication Testing Results:

  User Registration: WORKING
  POST /api/auth/register
  Response: HTTP 200 with JWT token

  User Login: WORKING
  POST /api/auth/login
  Response: HTTP 200 with JWT token

  ## Note: Passwords with special characters like "!" cause JSON parsing errors. Use
  alphanumeric passwords for now.