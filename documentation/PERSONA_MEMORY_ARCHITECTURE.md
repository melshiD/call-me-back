# Persona Memory Architecture - Multi-Tiered Design

**Date:** 2025-01-08 (Updated)
**Status:** Design Phase - Corrected based on Raindrop SmartMemory API

---

## ⚠️ Updated Based on Official Raindrop Documentation

This document accurately reflects **Raindrop's SmartMemory Core Concepts** as described in the official documentation:

**The 4 Memory Systems (Different Temporal Scales):**
1. **Working Memory** - Session-based active context (minutes)
2. **Episodic Memory** - Conversation history archives (hours/days)
3. **Semantic Memory** - Structured knowledge documents (timeless)
4. **Procedural Memory** - Behavioral templates and skills (cross-session)

**Key Insights:**
- Each system addresses different temporal scales and persistence levels
- Working memory = "what's happening NOW"
- Episodic memory = "what we discussed WHEN" (searchable session archives)
- Semantic memory = "timeless WHAT" (facts, knowledge)
- Procedural memory = "consistent HOW" (behavioral patterns)

---

## 🎭 The Persona Concept

Personas have **two layers of identity**:

1. **Core Personality** (System-level) - Who they fundamentally ARE
2. **Relationship Context** (User-level) - Who they are TO EACH USER

### Example: "Brad"

**Core Personality (Global):**
- Decisive
- Edgy
- Confident
- Direct communicator
- Doesn't sugarcoat things

**Relationship Context (User-Specific):**
- For Alice: Brad is her "bro friend" who talks sports, gives dating advice, and calls her "dude"
- For Bob: Brad is his "boyfriend" who's supportive, romantic, and uses pet names
- For Charlie: Brad is a "second boyfriend" in a poly relationship, navigating shared time

---

## 🧠 Raindrop SmartMemory - 4 Specialized Systems

SmartMemory mirrors human cognitive architecture through four systems operating at different scales:

### System 1: **Working Memory** - Session-Based Active Context
**Temporal Scale:** Minutes (single session)

- **Implementation:** Actor-based, maintains real-time interaction context
- **API:** `SmartWorkingMemory` actor with session-based state
- **Organization:** Supports timelines within a session (e.g., "technical", "planning")
- **Entry Structure:** Each memory includes content, timeline, agent attribution, temporal metadata
- **Retrieval Methods:**
  - `getMemory()` - Exact retrieval by query
  - `searchMemory()` - AI-powered semantic search
  - `putMemory()` - Add new memory entry
  - `deleteMemory()` - Remove specific entry
- **Session Control:**
  - `endSession(flush: true)` - Complete session and archive to episodic memory
  - `summarizeMemory()` - Generate AI summary of current session
- **Use Case:** Track immediate conversational state during an active phone call

---

### System 2: **Episodic Memory** - Conversation History Archives
**Temporal Scale:** Hours to days (completed sessions)

- **Storage:** Completed sessions automatically stored in SmartBuckets
- **AI Summaries:** System generates summaries capturing session essence while preserving searchable detail
- **Search API:** `searchEpisodicMemory(terms, options)` - Find relevant historical context
- **Rehydration:** `rehydrateSession(sessionId, summaryOnly?)` - Restore complete conversational state
- **Return Data:** Session summaries with metadata (sessionId, summary, agent, entryCount, duration, createdAt, score)
- **Use Case:** Reference "what we discussed last month about the database migration" or "follow up on the Sarah work conflict from last week"
- **Key Feature:** Sessions can be selectively queried or fully restored for context continuity

---

### System 3: **Semantic Memory** - Structured Knowledge Documents
**Temporal Scale:** Timeless (persistent knowledge)

- **Storage:** JSON documents in SmartBuckets with vector embeddings
- **Nature:** Factual information NOT tied to specific conversations
- **Content Examples:** Company policies, technical documentation, learned facts, user preferences, persona knowledge
- **Vector Search:** Automatic embeddings enable meaning-based retrieval (not keyword matching)
- **API Methods:**
  - `getSemanticMemory(objectId)` - Retrieve specific document
  - `putSemanticMemory(document)` - Store/update knowledge
  - `searchSemanticMemory(needle)` - Semantic similarity search
  - `deleteSemanticMemory(objectId)` - Remove knowledge
- **Use Case:** Store "Brad knows Alice is allergic to peanuts" or "Company policy on customer refunds" - facts that remain true independent of when they were learned

---

### System 4: **Procedural Memory** - Behavioral Templates and Skills
**Temporal Scale:** Cross-session (consistent patterns)

- **Storage:** Key-value pairs accessible across all sessions
- **Content Types:**
  - System prompts defining agent personality
  - Workflow templates for recurring tasks
  - Response patterns for consistent behavior
- **API:** `getProceduralMemory()` returns `SmartProceduralMemory` actor
- **Methods:**
  - `putProcedure(key, value)` - Store reusable pattern
  - `getProcedure(key)` - Retrieve pattern
  - `listProcedures()` - View all procedures
  - `searchProcedures(query)` - Find relevant procedures
- **Use Case:** Store "Brad's greeting template", "How to give relationship advice", "Persona voice/tone guidelines" - the behavioral consistency layer
- **Key Feature:** Provides the "HOW" that semantic memory's "WHAT" and episodic memory's "WHEN" cannot capture

---

## 📊 Memory System Comparison

| System | Scale | Persistence | Search Type | Primary Use |
|--------|-------|-------------|-------------|-------------|
| **Working** | Minutes | Session-only | Exact + Semantic | Active conversation state |
| **Episodic** | Hours/Days | Permanent archive | Semantic (summaries) | "What we discussed when" |
| **Semantic** | Timeless | Permanent | Vector similarity | "Factual knowledge" |
| **Procedural** | Cross-session | Permanent | Key-value + Search | "How to behave consistently" |

---

## 🎯 How Call Me Back Uses Each Memory System

### During a Phone Call:

1. **Working Memory** (Active Session)
   - Stores real-time conversation exchanges
   - Tracks current topics being discussed
   - Maintains context for AI response generation
   - Timeline: "main_conversation"
   - Agent: Persona name (e.g., "brad")

2. **Semantic Memory** (User-Persona Knowledge)
   - **Object ID:** `long_term:{user_id}:{persona_id}`
   - **Contents:** User facts, relationship details, inside jokes, preferences
   - **Retrieved:** At call start to build composite prompt
   - **Updated:** After call with newly learned facts

3. **Procedural Memory** (Persona Behavior)
   - **Procedures:** Greeting patterns, advice formats, conversation templates
   - **Loaded:** At call initialization for persona consistency
   - **Examples:** "brad_greeting", "brad_advice_style", "brad_farewell"

### After a Phone Call:

4. **Episodic Memory** (Call Archives)
   - `endSession(flush: true)` creates searchable session summary
   - Summary includes: key topics, decisions made, action items, emotional tone
   - Stored with metadata: sessionId, duration, cost, participants
   - **Search later:** "What did Brad and I discuss about work last month?"

### Separate Storage:

5. **Full Transcripts** (Compliance/Legal)
   - Stored in SmartBuckets: `transcripts/{user_id}/{persona_id}/{call_id}.json`
   - NOT in SmartMemory (different purpose)
   - Contains verbatim conversation for review/legal purposes
   - Linked to calls table via call_id

---

## 📊 Proposed Data Architecture

### 1. Core Persona Definition (Shared Globally)

**Stored in:** `personas` table (SmartSQL) + SmartMemory for runtime access

```json
{
  "id": "persona_brad_001",
  "name": "Brad",
  "description": "Decisive, edgy friend who keeps it real",
  "voice": "adam", // ElevenLabs voice ID
  "created_by": "system",
  "is_public": true,

  // CORE SYSTEM PROMPT - Same for everyone
  "core_system_prompt": "You are Brad - a decisive, confident guy who doesn't sugarcoat things. You're edgy but caring. You speak directly and help people make tough calls. You're the friend who tells it like it is.",

  // PERSONALITY TRAITS - Consistent across all users
  "personality_traits": {
    "communication_style": "direct, no-nonsense",
    "humor_type": "dry, sarcastic",
    "empathy_level": "medium-high (shows through actions not words)",
    "decision_making": "fast, confident",
    "voice_tone": "casual, masculine, slightly gruff"
  },

  // BEHAVIORAL GUIDELINES
  "behavioral_rules": [
    "Always be decisive when asked for advice",
    "Use casual language, occasional profanity if appropriate",
    "Don't be overly emotional or touchy-feely",
    "Give practical solutions, not just sympathy",
    "Be supportive but keep it real"
  ]
}
```

---

### 2. User-Persona Relationship Context (Per User)

**Stored in:** New `user_persona_relationships` table (SmartSQL)

```sql
CREATE TABLE user_persona_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,

  -- USER-SPECIFIC RELATIONSHIP CONTEXT
  relationship_type VARCHAR(50) NOT NULL, -- 'friend', 'boyfriend', 'brother', 'boss', etc.
  custom_system_prompt TEXT, -- User's customization layer

  -- RELATIONSHIP METADATA
  relationship_started_at TIMESTAMP DEFAULT NOW(),
  total_calls INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  last_call_at TIMESTAMP,

  -- MEMORY CONFIGURATION
  memory_config JSONB DEFAULT '{}', -- User preferences for what to remember

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, persona_id)
);

CREATE INDEX idx_user_persona_rel ON user_persona_relationships(user_id, persona_id);
```

**Example Relationship Record:**

```json
{
  "user_id": "user_alice_123",
  "persona_id": "persona_brad_001",
  "relationship_type": "bro_friend",

  // USER-LEVEL SYSTEM PROMPT EXTENSION
  "custom_system_prompt": "You and Alice are close bros. You call her 'dude' or 'Al'. You guys talk about sports, dating, and guy stuff. You met at a college party 5 years ago. Inside jokes: 'the burrito incident', 'never trust a guy named Trevor'.",

  // MEMORY SETTINGS
  "memory_config": {
    "remember_relationship_details": true,
    "remember_past_conversations": true,
    "remember_personal_facts": true,
    "auto_recall_depth": 10 // Number of past calls to auto-load
  },

  "total_calls": 47,
  "total_minutes": 312,
  "last_call_at": "2025-01-06T14:30:00Z"
}
```

---

### 3. SmartMemory Storage Strategy

#### **Working Memory (Tier 1) - Active Call**

**Key Pattern:** `call_session:{call_id}`

```json
{
  "session_id": "call_abc123",
  "user_id": "user_alice_123",
  "persona_id": "persona_brad_001",
  "relationship_id": "rel_xyz789",

  "conversation_history": [
    { "role": "user", "content": "Hey Brad, I need help...", "timestamp": "..." },
    { "role": "assistant", "content": "What's up dude?", "timestamp": "..." }
  ],

  "current_context": {
    "topic": "work_conflict",
    "mood": "stressed",
    "urgency": "medium",
    "needs_decision": true
  },

  "session_metadata": {
    "call_started_at": "2025-01-07T10:00:00Z",
    "turns": 8,
    "avg_response_time": 2.3
  }
}
```

**Expiration:** End of call + 1 hour (for debugging)

---

#### **Semantic Memory (Tier 2) - Structured Knowledge**

**API Method:** `putSemanticMemory()` / `getSemanticMemory()`

**Object ID Pattern:** `recent_calls:{user_id}:{persona_id}`

```json
{
  "id": "recent_calls:user_alice_123:persona_brad_001",
  "user_id": "user_alice_123",
  "persona_id": "persona_brad_001",

  "recent_calls": [
    {
      "call_id": "call_abc123",
      "date": "2025-01-07T10:00:00Z",
      "summary": "Discussed conflict with coworker Sarah. Decided to confront directly.",
      "key_topics": ["work", "confrontation", "sarah_coworker"],
      "outcome": "action_planned"
    },
    {
      "call_id": "call_abc122",
      "date": "2025-01-05T15:30:00Z",
      "summary": "Talked about upcoming date with Jessica. Gave advice on restaurant.",
      "key_topics": ["dating", "jessica", "relationship_advice"],
      "outcome": "advice_given"
    }
    // ... last 10 calls
  ],

  "ongoing_storylines": [
    {
      "topic": "sarah_work_conflict",
      "first_mentioned": "2025-01-07T10:00:00Z",
      "status": "in_progress",
      "summary": "Alice having issues with coworker Sarah being passive-aggressive"
    }
  ]
}
```

**Note:** Stored as semantic document for vector search capabilities

---

#### **Semantic Memory (Also Tier 2) - Long-Term Facts**

**API Method:** `putSemanticMemory()` / `getSemanticMemory()`

**Object ID Pattern:** `long_term:{user_id}:{persona_id}`

```json
{
  "user_id": "user_alice_123",
  "persona_id": "persona_brad_001",

  "relationship_facts": {
    "how_we_met": "College party in 2020, bonded over terrible DJ",
    "friendship_duration_years": 5,
    "trust_level": "high",
    "communication_frequency": "weekly"
  },

  "user_facts": {
    "job": "Software Engineer at TechCorp",
    "boss_name": "Marcus",
    "coworkers": ["Sarah (problematic)", "Jake (cool)", "Priya (mentor)"],
    "dating_status": "Casually seeing Jessica",
    "hobbies": ["rock climbing", "fantasy football", "craft beer"],
    "allergies": ["peanuts"],
    "family": {
      "mom": "Lives in Ohio, calls every Sunday",
      "dad": "Passed away 2018",
      "siblings": ["Younger brother Tom (college)"]
    }
  },

  "inside_jokes": [
    "The burrito incident (2021) - food poisoning before presentation",
    "Never trust a guy named Trevor (ex-boyfriend reference)",
    "Brad's terrible fantasy team name suggestions"
  ],

  "important_memories": [
    {
      "event": "Helped Alice through breakup with Trevor",
      "date": "2022-03-15",
      "significance": "high",
      "summary": "3-hour call, Alice was devastated, Brad came over with pizza"
    },
    {
      "event": "Alice got promoted to Senior Engineer",
      "date": "2024-06-01",
      "significance": "high",
      "summary": "Brad was first person she called, celebrated together"
    }
  ],

  "preferences": {
    "greeting_style": "casual ('Yo', 'What's up dude')",
    "advice_style": "direct but supportive",
    "topics_to_avoid": ["dad's death (sensitive)", "weight/body image"],
    "favorite_topics": ["work wins", "dating stories", "sports"]
  }
}
```

**Note:** Both recent context and long-term facts use Semantic Memory (Tier 2), just with different object IDs

---

#### **Procedural Memory (Tier 3) - Conversation Patterns**

**API Method:** `getProceduralMemory()` returns actor with `putProcedure()`, `getProcedure()`

**Use Case:** Store learned conversation patterns and behaviors

```json
// Example procedures for Brad + Alice relationship
{
  "greeting_pattern": "Yo {name}, what's up?",
  "concern_response": "Alright, talk to me. What's going on?",
  "advice_format": "Here's what I'd do: {direct_action}. No BS.",
  "farewell_pattern": "Alright dude, you got this. Hit me up if you need anything."
}
```

**Note:** Procedural memory is for reusable patterns, not specific facts

---

#### **Episodic Memory (Tier 4) - Session Summaries**

**API Method:** `searchEpisodicMemory(terms)` - searches across archived session summaries

**Creation:** Automatically created when `workingMemory.endSession(flush: true)`

**Contents:** AI-generated session summaries with metadata

```json
// Example search result from searchEpisodicMemory("work conflict")
{
  "results": [
    {
      "sessionId": "session_abc123",
      "summary": "Alice discussed conflict with coworker Sarah. Brad advised direct confrontation. Covered specific talking points and backup plan if HR needed.",
      "agent": "brad",
      "entryCount": 24,
      "timelineCount": 1,
      "duration": 754,
      "createdAt": "2025-01-07T10:12:34Z",
      "score": 0.92
    },
    {
      "sessionId": "session_abc098",
      "summary": "Follow-up about Sarah situation. Alice reported successful conversation. Sarah apologized for behavior.",
      "agent": "brad",
      "entryCount": 18,
      "timelineCount": 1,
      "duration": 512,
      "createdAt": "2025-01-09T14:22:10Z",
      "score": 0.87
    }
  ]
}
```

**Important:** Episodic memory stores SESSION SUMMARIES, NOT full transcripts. For compliance/legal requirements, store full transcripts separately in SmartBuckets.

---

#### **Full Transcripts (Separate Storage)**

**Stored in:** SmartBuckets (S3-compatible object storage)

**Path Pattern:** `transcripts/{user_id}/{persona_id}/{call_id}.json`

```json
{
  "call_id": "call_abc123",
  "user_id": "user_alice_123",
  "persona_id": "persona_brad_001",
  "relationship_id": "rel_xyz789",

  "call_metadata": {
    "started_at": "2025-01-07T10:00:00Z",
    "ended_at": "2025-01-07T10:12:34Z",
    "duration_seconds": 754,
    "cost_usd": 5.23
  },

  "full_transcript": [
    {
      "speaker": "user",
      "text": "Hey Brad, got a minute?",
      "timestamp": "2025-01-07T10:00:03Z"
    },
    {
      "speaker": "brad",
      "text": "Yeah dude, what's going on?",
      "timestamp": "2025-01-07T10:00:05Z"
    }
    // ... full conversation
  ],

  "extracted_entities": {
    "people_mentioned": ["Sarah (coworker)", "Marcus (boss)", "Jessica (dating)"],
    "topics": ["work conflict", "confrontation strategy", "weekend plans"],
    "emotions": ["stressed", "frustrated", "relieved by end"],
    "decisions_made": ["Talk to Sarah Monday morning", "Document interactions", "Loop in Marcus if needed"]
  },

  "embedding_vector": [0.123, 0.456, ...], // For semantic search

  "tags": ["work", "conflict_resolution", "advice_given"]
}
```

**Retention:** Configurable (default: 1 year, premium: forever)

---

## 🔄 How It All Comes Together During a Call

### Call Initialization Flow:

```javascript
async function initializeCall(userId, personaId, phoneNumber) {
  // 1. Load Core Persona
  const persona = await loadPersona(personaId);
  const corePrompt = persona.core_system_prompt;
  const personalityTraits = persona.personality_traits;

  // 2. Load or Create User-Persona Relationship
  let relationship = await getRelationship(userId, personaId);
  if (!relationship) {
    relationship = await createRelationship(userId, personaId, {
      relationship_type: 'friend', // Default
      custom_system_prompt: null
    });
  }

  // 3. Load Long-Term Memory
  const longTermMemory = await smartMemory.get({
    key: `long_term:${userId}:${personaId}`
  });

  // 4. Load Recent Context (Short-Term Memory)
  const recentContext = await smartMemory.get({
    key: `recent_calls:${userId}:${personaId}`
  });

  // 5. Build Composite System Prompt
  const finalSystemPrompt = buildSystemPrompt({
    corePrompt,
    personalityTraits,
    relationship,
    longTermMemory,
    recentContext
  });

  // 6. Create Working Memory Session
  const callId = generateCallId();
  await smartMemory.set({
    key: `call_session:${callId}`,
    value: {
      session_id: callId,
      user_id: userId,
      persona_id: personaId,
      relationship_id: relationship.id,
      conversation_history: [],
      current_context: {},
      system_prompt: finalSystemPrompt
    }
  });

  // 7. Initiate Twilio Call
  return initiatePhoneCall(phoneNumber, callId);
}
```

---

### Composite System Prompt Example:

```text
=== CORE IDENTITY ===
You are Brad - a decisive, confident guy who doesn't sugarcoat things. You're edgy but caring. You speak directly and help people make tough calls. You're the friend who tells it like it is.

=== YOUR RELATIONSHIP WITH THIS USER ===
You and Alice are close bros. You call her 'dude' or 'Al'. You guys talk about sports, dating, and guy stuff. You met at a college party 5 years ago.

Inside jokes you share:
- The burrito incident (when she got food poisoning before a big presentation)
- "Never trust a guy named Trevor" (her terrible ex)

=== WHAT YOU KNOW ABOUT ALICE ===
- Job: Software Engineer at TechCorp, reports to Marcus
- Currently: Casually dating Jessica
- Coworkers: Sarah (problematic), Jake (cool), Priya (mentor)
- Family: Mom in Ohio, younger brother Tom in college, dad passed in 2018 (sensitive topic)
- Hobbies: Rock climbing, fantasy football, craft beer
- Allergic to: Peanuts

=== RECENT CONTEXT ===
Last call (2 days ago): Discussed upcoming date with Jessica, you recommended that Italian place downtown.

Current ongoing situation: Alice mentioned tension with coworker Sarah last week - follow up on this if relevant.

=== CONVERSATION STYLE ===
- Greet casually: "Yo", "What's up dude", "Al, what's going on"
- Be direct but supportive with advice
- Avoid: Her dad's death, weight/body image topics
- She values: Practical solutions, real talk, someone who won't judge

=== YOUR TASK ===
Alice is calling you right now. Be Brad - the bro she can count on for straight talk and solid advice.
```

---

## 🛠️ Implementation Requirements

### New Backend Features Needed:

1. **New Database Table:**
   - `user_persona_relationships` with fields for custom prompts and relationship metadata

2. **New API Endpoints:**
   - `POST /api/personas/:id/customize` - Set user-level relationship type and custom prompt
   - `GET /api/personas/:id/relationship` - Get current relationship details
   - `PUT /api/personas/:id/relationship` - Update relationship context
   - `GET /api/personas/:id/memories` - View what the persona knows about you

3. **SmartMemory Integration:**
   - Working memory session management (Tier 1)
   - Recent calls caching (Tier 2)
   - Long-term facts storage (Tier 3)
   - Transcript archival to SmartBuckets (Tier 4)

4. **Memory Management Logic:**
   - **Post-call processing:** Extract key facts, update long-term memory
   - **Importance scoring:** Decide what goes into long-term vs just episodic
   - **Context window management:** Pull relevant memories without exceeding token limits
   - **Memory decay:** Older short-term memories fade unless re-mentioned

5. **Prompt Engineering:**
   - Template system for building composite prompts
   - Token budget management (core + relationship + memory must fit in context)
   - Dynamic memory selection (most relevant facts for current topic)

---

## 🎯 User Experience Flow

### First-Time User with Brad:

1. User adds Brad to contacts
2. System prompts: "What's your relationship with Brad?"
   - Options: Friend, Partner, Family Member, Professional, Custom
3. User selects "Friend" → Optional: "Tell us more about your friendship"
4. User writes: "Brad is my bro from college. We talk about sports and dating."
5. System creates relationship record with custom_system_prompt
6. First call: Brad knows core personality + relationship type + user's custom context
7. After call: System extracts facts → stores in long-term memory

### Returning User (10th call with Brad):

1. User triggers call
2. System loads:
   - Core Brad personality ✓
   - User-Brad relationship context ✓
   - Long-term memories (47 facts about Alice) ✓
   - Recent context (last 10 calls) ✓
   - Ongoing storylines (Sarah work conflict) ✓
3. Call starts: "Yo Al! How'd that thing with Sarah go?"
4. Brad remembers everything, conversation feels continuous

---

## 🧪 Testing Strategy

### Memory Persistence Tests:

1. **Call 1:** User mentions "I love rock climbing"
2. **Call 2:** Brad should remember and ask "Been climbing lately?"
3. **Call 5:** Brad should still remember without being reminded

### Relationship Context Tests:

1. **Alice + Brad (friend):** Brad uses "dude", talks casual
2. **Bob + Brad (boyfriend):** Brad uses "babe", talks romantic
3. Same core personality (decisive, edgy) but different relationship dynamics

### Memory Tier Tests:

1. **Working:** Context maintained within single call
2. **Short-Term:** Recent topics recalled across calls this week
3. **Long-Term:** Important facts persist for months
4. **Episodic:** Can search old transcripts for specific conversations

---

## 📋 Database Migration Needed

```sql
-- Add the new relationship table
CREATE TABLE user_persona_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL DEFAULT 'friend',
  custom_system_prompt TEXT,
  memory_config JSONB DEFAULT '{"remember_relationship_details":true,"remember_past_conversations":true,"remember_personal_facts":true,"auto_recall_depth":10}',
  relationship_started_at TIMESTAMP DEFAULT NOW(),
  total_calls INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  last_call_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, persona_id)
);

CREATE INDEX idx_user_persona_rel ON user_persona_relationships(user_id, persona_id);
CREATE INDEX idx_relationship_type ON user_persona_relationships(relationship_type);
CREATE INDEX idx_last_call ON user_persona_relationships(last_call_at DESC);

-- Add memory importance scoring to calls table
ALTER TABLE calls ADD COLUMN memory_extracted BOOLEAN DEFAULT FALSE;
ALTER TABLE calls ADD COLUMN auto_summary TEXT;
ALTER TABLE calls ADD COLUMN extracted_facts JSONB;
```

---

## 🚀 Next Steps

1. **Review & Approve Architecture:** Does this 4-tiered approach work for your vision?
2. **Implement Database Schema:** Add `user_persona_relationships` table
3. **Build Memory Management Service:** Handle Tier 1-4 storage/retrieval
4. **Create Prompt Builder:** Composite system prompt generation
5. **Add Relationship Endpoints:** API for customizing user-persona relationships
6. **Test Memory Persistence:** Verify facts are recalled correctly across calls

---

**Questions to Resolve:**

1. Should users explicitly "customize" relationships, or should the system learn from conversations?
2. How much control should users have over what gets remembered?
3. Should there be a UI to view/edit what Brad "knows" about them?
4. What's the token budget for memory context in prompts? (e.g., max 2000 tokens for memories)
5. Privacy: Can users delete specific memories without deleting the entire relationship?

---

This architecture enables truly personalized AI companions that feel continuous and real! 🎭
