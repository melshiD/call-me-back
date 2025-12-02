#THREE BIG THINGS: Connection stability, cost tracking, and prompts need to be FAR more configurable (and the "get out of a date" config will be different from the "call from boss" or "call from sponsor" config): "Quick Calls" will be closer to what we currently implemnt.  Keep things as simple for now as is possible for hackathon.

WE just 'fixed' the call connection stability, but on my last test, Sarah was EXTRA droppy-outty
Research great pompts for voice.  Build app for me to easily configure these fantastic prompts.  Figure out how to implement SmartMemory properly to give good chat experience (currenttly they're entertaining, but not realistic)

Oooh, we should enable background audio to add to the realism of calls from specific place types.

LET ME FILL OUT GENERATED PERSONA TEMPLATES (need to design generated persona templates)

Should we be creating a "TwiML App"? I read it on the Twilio dashboard.

Tell the bot it's just started in a phone conversation with [relationship] and the purpose of the call is [purpose].  That's a good bit of prompt not to forget.
Don't say performative words/tags outloud (how is that happening anyway?)

Tell claude that when updating code or adding code, do not remove useful documentation.  If documentation is being removed it is because we changed our tech and don't use that tech anymore, or parts of it need updated and so only portions are updated.  Documentation is not to be haplessly removed.

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

Get ahold of an MCP server or a /skills config to be an incredible UI designer.

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

  Tell claude when to make documentationa and when not to... what to maintain and what not to.

Feature addition where I can, from the frontend Admin app, paste in screenshots and have them available in an organized file folder on cloud for analysis.  I can send analysis instructions to my workflow/ai bot integration (right now it's you, but we could build a way to use other services and apis to do it from the frontend for me).  That way showing UI examples would be easier, as would taking screenshots of screenshots others are using to try to debug their code.  I'm having pretty good success with you here, so perhaps our context could help solve their problem (ie, we've already conquored their issue and can now help)  - ANothedr option for the example sharing would be to use a headless browser, if that'll ever work!

  #TO BE DONE!
  - Security issue with log-query-service

Debug the SHIT out of price tracking and usage data acquisition.

Checkout why so many un-perpetrated events and new-saves come up as "Brad" even when I'm selecting alex.

Set up twilio webhooks for the persona designer button (stop live "recording" type feedback when we stop the call)

(what is : ● Bash(raindrop build deploy > /tmp/deploy_output.txt 2>&1 & timeout: 10s
      echo "Deploy started in background with PID $!")
  ⎿  Running in the background (down arrow to manage))

"Schedule" doesn't work in Admin panel.  Permission denied. (NOT a priority right now, I can use my usership instead to schedule)

Make a cool svg about "made by" or "powered by" with the partnered tech insignias in a circle, that can be cliked on to link to the partnered service.. OOH, or to a page I make for partnered servies.

Fix the awful User dashboard and what it shows and make it accurate

Nowhere in this app are we sending emails to the user!  We should definitely set some of that up!  And a thank you email to judges parhaps, when they use the coupon.

Are we even using the cost analytics service?