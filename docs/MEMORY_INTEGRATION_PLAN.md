# Memory Integration Plan for Voice Pipeline

## Architecture Decisions

### 1. Memory Ownership Model ✅

**User Decision Confirmed:**
- **Procedural Memory**: Shared across all users (defines HOW the persona behaves)
- **Working/Episodic/Semantic Memory**: Isolated per user-persona pair
- **Voice Settings**: User preference, completely decoupled from persona identity

**Rationale:**
- Alice's Brad and Bob's Brad have the same personality but completely different memories
- Alice can configure Brad to use voice X, Bob can use voice Y for the same persona
- Users can even use the same voice across multiple personas if they want

### 2. Memory Key Structure

```typescript
// USER-SPECIFIC MEMORY (isolated per relationship)
const userSpecificKeys = {
  working: `working:${userId}:${personaId}:${callId}`,
  semantic_longterm: `long_term:${userId}:${personaId}`,
  semantic_recent: `recent_calls:${userId}:${personaId}`,
  episodic: `episodic:${userId}:${personaId}`  // Collection/bucket name
};

// PERSONA-WIDE MEMORY (shared across all users)
const personaWideKeys = {
  procedural: `procedural:${personaId}`  // NOT scoped to userId
};
```

### 3. Database Schema Updates

#### Extended `user_persona_relationships` table:

```sql
ALTER TABLE user_persona_relationships
ADD COLUMN voice_id VARCHAR(100),           -- User's voice preference
ADD COLUMN voice_settings JSONB DEFAULT '{  -- User's voice customization
  "stability": 0.5,
  "similarity_boost": 0.75,
  "speed": 1.0,
  "style": 0.0
}';

-- Index for voice lookups
CREATE INDEX idx_user_persona_voice ON user_persona_relationships(voice_id);
```

#### Example relationship records:

```json
// Alice's configuration of Brad
{
  "user_id": "alice_123",
  "persona_id": "brad_001",
  "relationship_type": "bro_friend",
  "voice_id": "adam",              // Alice wants Brad with Adam voice
  "voice_settings": {
    "stability": 0.5,
    "speed": 1.1                   // Alice likes faster speech
  },
  "custom_system_prompt": "You and Alice are bros..."
}

// Bob's configuration of Brad (same persona, different everything)
{
  "user_id": "bob_456",
  "persona_id": "brad_001",        // Same Brad persona
  "relationship_type": "boyfriend",
  "voice_id": "antoni",            // Bob wants Brad with Antoni voice
  "voice_settings": {
    "stability": 0.6,
    "speed": 0.95                  // Bob prefers slower, warmer tone
  },
  "custom_system_prompt": "You and Bob are in a relationship..."
}
```

## Integration Points in Voice Pipeline

### Phase 1: Configuration Loading (Before Call Starts)

**Location**: `src/voice-pipeline/index.ts` → `handleConnection()`

**Flow**:
```typescript
async handleConnection(ws: WebSocket, callId: string, userId: string, personaId: string) {
  // 1. Load persona (core personality)
  const persona = await loadPersona(personaId);

  // 2. Load or create user-persona relationship
  const relationship = await getOrCreateRelationship(userId, personaId);

  // 3. Extract voice configuration from relationship (NOT persona)
  const voiceConfig = {
    voiceId: relationship.voice_id || persona.default_voice_id,
    voiceSettings: relationship.voice_settings || DEFAULT_VOICE_SETTINGS
  };

  // 4. Create pipeline with user-specific voice config
  const config: VoicePipelineConfig = {
    // ... other config
    voiceId: voiceConfig.voiceId,
    voiceSettings: voiceConfig.voiceSettings,

    // Memory context
    personaId,
    userId,
    callId
  };

  const pipeline = new VoicePipelineOrchestrator(config, costTracker);
  await pipeline.start(ws);
}
```

### Phase 2: Memory Initialization (Call Start)

**Location**: `VoicePipelineOrchestrator.start()`

**New Method**: `initializeMemory()`

```typescript
async start(twilioWs: WebSocket): Promise<void> {
  console.log('[VoicePipeline] Starting pipeline');
  this.callStartTime = Date.now();

  // NEW: Initialize memory manager
  this.memoryManager = new PersonaMemoryManager({
    userId: this.config.userId,
    personaId: this.config.personaId,
    callId: this.config.callId,
    smartMemoryClient: this.env.SMART_MEMORY  // From Raindrop env
  });

  // NEW: Load memory context from all tiers
  this.memoryContext = await this.memoryManager.initializeCallMemory(
    this.corePersona,
    this.relationship
  );

  // NEW: Build composite system prompt
  this.systemPrompt = this.memoryManager.buildSystemPrompt(this.memoryContext);

  console.log('[VoicePipeline] Memory context loaded');

  // Continue with existing connection flow
  this.twilioHandler.handleConnection(twilioWs);
  await Promise.all([
    this.sttHandler.connect(),
    this.ttsHandler.connect()
  ]);
}
```

### Phase 3: Working Memory Updates (During Call)

**Location**: STT Handler callbacks + Response generation

**User message committed**:
```typescript
onCommittedTranscript: async (text) => {
  // ... existing code ...

  // NEW: Add to working memory
  await this.memoryManager.addToWorkingMemory('user', text);

  // Continue with existing flow
  this.conversationHistory.push({
    role: 'user',
    content: text
  });
}
```

**AI response generated**:
```typescript
private async generateAIResponse(): Promise<void> {
  // ... generate response ...

  const responseText = response.text.trim();

  // NEW: Add to working memory
  await this.memoryManager.addToWorkingMemory('assistant', responseText);

  // Continue with existing flow
  this.conversationHistory.push({
    role: 'assistant',
    content: responseText
  });
}
```

### Phase 4: AI Response with Memory Context (The Key Change!)

**Location**: `VoicePipelineOrchestrator.generateAIResponse()`

**OLD CODE**:
```typescript
const systemPrompt = 'You are a helpful AI assistant...';  // Generic
const userPrompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
```

**NEW CODE**:
```typescript
// Use composite system prompt with full memory context
const systemPrompt = this.systemPrompt;  // Already built from all memory tiers!

// Build conversation context (still use recent history for immediate context)
const conversationContext = this.conversationHistory.slice(-10)
  .map(m => `${m.role}: ${m.content}`)
  .join('\n');

const response = await llmService.complete({
  systemPrompt: systemPrompt,  // Rich context from all memory tiers
  prompt: conversationContext,  // Recent conversation flow
  maxTokens: 150,
  temperature: 0.7
});
```

### Phase 5: Memory Finalization (Call End)

**Location**: `VoicePipelineOrchestrator.stop()`

**NEW**: Extract facts and update memory

```typescript
async stop(): Promise<void> {
  console.log('[VoicePipeline] Stopping pipeline');

  // NEW: Extract facts from conversation and update memory
  const memoryUpdate = await this.extractMemoryUpdates();

  await this.memoryManager.finalizeCallMemory(memoryUpdate);

  // Continue with existing cleanup
  this.sttHandler.disconnect();
  this.ttsHandler.disconnect();
  this.twilioHandler.close();

  const callDuration = (Date.now() - this.callStartTime) / 1000;
  await this.costTracker.finalize(callDuration);
}

private async extractMemoryUpdates(): Promise<MemoryUpdate> {
  // Use Cerebras to analyze conversation and extract:
  // 1. New facts learned about the user
  // 2. Conversation summary
  // 3. Key topics discussed
  // 4. Emotional tone
  // 5. Any decisions made
  // 6. Ongoing storylines

  const conversationText = this.conversationHistory
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const llmService = LLMServiceFactory.getCerebras();

  const extractionPrompt = `Analyze this conversation and extract:
1. New facts learned about the user (name them as KEY: VALUE pairs)
2. Brief summary of the conversation (2-3 sentences)
3. Key topics discussed (comma-separated)
4. Emotional tone (e.g., "stressed", "happy", "frustrated")
5. Any decisions the user made
6. Any ongoing situations to follow up on

Conversation:
${conversationText}

Respond in JSON format:
{
  "newFacts": [{"category": "...", "content": "...", "importance": "high|medium|low"}],
  "conversationSummary": "...",
  "keyTopics": ["...", "..."],
  "emotionalTone": "...",
  "decisions": ["...", "..."],
  "ongoingStorylines": [{"topic": "...", "status": "...", "summary": "..."}]
}`;

  const response = await llmService.complete({
    systemPrompt: 'You are a memory extraction assistant. Extract structured information from conversations.',
    prompt: extractionPrompt,
    maxTokens: 500,
    temperature: 0.3  // Lower temp for consistent extraction
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error('[VoicePipeline] Failed to parse memory extraction:', error);
    return {
      conversationSummary: 'Conversation completed',
      keyTopics: [],
      emotionalTone: 'neutral'
    };
  }
}
```

## Implementation Checklist

### Database & Schema
- [ ] Add `voice_id` and `voice_settings` columns to `user_persona_relationships`
- [ ] Add default voice to `personas` table (fallback if user doesn't customize)
- [ ] Create migration script

### Memory Manager Service
- [x] Create `PersonaMemoryManager` class
- [ ] Implement SmartMemory client integration
- [ ] Add fact extraction logic
- [ ] Add memory formatting helpers

### Voice Pipeline Integration
- [ ] Add `PersonaMemoryManager` to VoicePipelineOrchestrator constructor
- [ ] Call `initializeCallMemory()` in `start()` method
- [ ] Use composite system prompt in `generateAIResponse()`
- [ ] Add working memory updates in STT/response handlers
- [ ] Call `finalizeCallMemory()` in `stop()` method
- [ ] Implement `extractMemoryUpdates()` method

### API Endpoints (Persona Manager Service)
- [ ] `GET /api/users/:userId/personas/:personaId/relationship` - Get relationship config
- [ ] `PUT /api/users/:userId/personas/:personaId/voice` - Customize voice
- [ ] `GET /api/users/:userId/personas/:personaId/memories` - View what persona knows
- [ ] `DELETE /api/users/:userId/personas/:personaId/memories/:memoryId` - Delete specific memory

### Testing
- [ ] Unit test: Memory key scoping (user isolation)
- [ ] Integration test: Voice configuration per user
- [ ] Integration test: Memory persistence across calls
- [ ] Integration test: Procedural memory shared across users
- [ ] End-to-end test: Alice calls Brad (voice X), Bob calls Brad (voice Y)

## Benefits of This Architecture

### 1. **Complete User Isolation**
- Alice's memories with Brad are totally separate from Bob's
- No risk of memory leakage between users
- Each relationship develops independently

### 2. **Flexible Voice Customization**
- Users can configure any persona with any voice
- Voice settings are per-user preference, not persona constraint
- Multiple personas can share the same voice if user wants

### 3. **Consistent Persona Behavior**
- Procedural memory ensures Brad acts like Brad for everyone
- Core personality traits are maintained across all users
- Behavioral patterns (greeting style, advice format) stay consistent

### 4. **Rich Memory Context**
- Working: Immediate conversation state
- Episodic: "Remember when we talked about X last week?"
- Semantic: Long-term facts, preferences, inside jokes
- Procedural: Consistent tone and behavior patterns

### 5. **Scalable Architecture**
- Memory keys clearly scoped (user-specific vs persona-wide)
- Easy to add new memory types or tiers
- Clean separation of concerns

## Example: Memory Flow for Alice & Brad

### Call 1 (Alice's first call with Brad)

**Memory State Before**:
- Working: Empty
- Episodic: None
- Semantic (long_term): Empty default structure
- Procedural: Brad's greeting/tone patterns

**During Call**:
- Alice: "Hey Brad, I'm Alice. I'm a software engineer and I love rock climbing."
- Working memory stores real-time messages
- Brad responds using procedural patterns

**Memory State After**:
- Working: Archived to episodic
- Episodic: Session summary created
- Semantic (long_term): Updated with facts:
  ```json
  {
    "user_facts": {
      "name": "Alice",
      "job": "Software Engineer",
      "hobbies": ["rock climbing"]
    }
  }
  ```
- Semantic (recent_calls): First call summary added

### Call 2 (Alice calls Brad again, 3 days later)

**Memory State Before**:
- Semantic (long_term): Has Alice's facts from Call 1
- Semantic (recent_calls): Has Call 1 summary
- Procedural: Brad's consistent patterns

**System Prompt Includes**:
```
=== WHAT YOU KNOW ABOUT THIS USER ===
- Name: Alice
- Job: Software Engineer
- Hobbies: Rock climbing

=== RECENT CONTEXT ===
3 days ago: First conversation with Alice. She introduced herself and mentioned her work and hobbies.
```

**During Call**:
- Brad: "Hey Alice! Been climbing lately?"
- Alice: "Yeah! I actually went to that new gym downtown."
- **Brad remembers without being reminded!**

**Memory State After**:
- Semantic (long_term): Updated with new fact (new gym)
- Semantic (recent_calls): Call 2 summary added (max 10 kept)

### Call 10 (Alice calls about work problem)

**System Prompt Includes**:
- Core Brad personality
- Alice relationship context ("bro friend")
- 9 previous call summaries
- All accumulated facts about Alice
- Brad's consistent advice-giving patterns

**Result**: Natural, continuous relationship that feels real

---

## Next Steps

1. **Review & Approve**: Does this architecture match your vision?
2. **Database Migration**: Add voice config columns
3. **Complete Memory Manager**: Integrate with Raindrop SmartMemory API
4. **Update Voice Pipeline**: Add memory initialization and finalization
5. **Test Memory Isolation**: Verify user-persona memory scoping
6. **Build API Endpoints**: Let users customize voice and view memories

**Questions:**
1. Should users see/edit what personas "know" about them?
2. Privacy: Delete specific memories vs entire relationship?
3. Should procedural memory be editable by admins (to improve persona behavior)?
4. Token budget for system prompt (memory context can get large)?
