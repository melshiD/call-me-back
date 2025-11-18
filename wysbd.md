WE just 'fixed' the call connection stability, but on my last test, Sarah was EXTRA droppy-outty
Research great pompts for voice.  Build app for me to easily configure these fantastic prompts.  Figure out how to implement SmartMemory properly to give good chat experience (currenttly they're entertaining, but not realistic)

Oooh, we should enable background audio to add to the realism of calls from specific place types.

## Persona info
- 1: Role: You are an x that is good at y.  You use your knowledge or skills in y to enact towards a z. (You are an X who specalizes in Y and your goals are Z)
- 2: Context: What is the environment?  What is the agent's "place in the world"
- 3: Guidelines: Instructions (specifics) on how to behave
- 4: Example phrases, responses, conversations.
- 5?: For friends, past experiences together (can be written by user)
    - For businesspartners, deals and experiences made together.
    - etc.
    - (Some users could really get a kick out of building a past with a bot)

As use-cases diverge (essentially all on the app right now are diversion/excuse generators to extracate oneself from a disagreeable situation.  But other means can be achieved.  To do this, we need to further abstract how the "persona" is generated, and how specific types of goals need to be injected to get "Brad" to extricate you or to help you practice you negotiatino skills)

Perhaps we allow users to pick which number/state location the call comes from.  Value in specific use cases, but maybe not worth the while.

- Mention about making sure timezones are heeded (perhaps implement as a timer function for safety) to make sure the scheduled calls at the correct, expected time.
- build simple set of routines for Claude to follow EVERYTIME it wants to do something (like DONT EXPOSE KEYS OR SECRETS in your logs)
- frontend error says twillio env vars arent set... check the shell script
- Set up WorkOS for auth
- "add to contacts' button doesn't work

!!! EXPLAIN TO CLAUDE WE NEED TO IMPLEMENT WORKOS for auth!


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