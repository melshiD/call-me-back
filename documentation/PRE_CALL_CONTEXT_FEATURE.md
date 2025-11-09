# Pre-Call Context Feature - "Call Scenario" System

**Date:** 2025-01-07
**Feature:** User-Defined Call Context/Scenario
**Priority:** High (Core UX Feature)

---

## 🎯 The Problem

Users need to give the AI persona **specific instructions** for the upcoming call, such as:
- "Call to save me from a lame date - let's talk about movies and your mother"
- "Pretend you're my boss calling about an urgent project deadline"
- "Act like we're planning my birthday party"
- "Emergency! You need to sound concerned about our fake sick dog"

This is **different** from the relationship context (which is persistent) - this is **situational** and **temporary** for just this one call.

---

## 💡 The Solution: "Call Scenario"

Add a **call_scenario** field that users can optionally provide when triggering a call. This scenario is:
- ✅ **Call-specific** - Only applies to this one call
- ✅ **User-written** - Free-form text describing the situation
- ✅ **Persona-aware** - Combined with persona's core prompt + relationship context
- ✅ **Temporary** - Doesn't affect future calls (unless saved as template)
- ✅ **Optional** - Quick calls can skip it

---

## 📊 Database Schema Updates

### **Add Column to `calls` Table:**

```sql
-- In src/sql/call-me-back-db.ts

ALTER TABLE calls ADD COLUMN call_scenario TEXT;
```

**Updated `calls` table:**
```sql
CREATE TABLE IF NOT EXISTS calls (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  persona_id TEXT,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL,

  -- NEW: User-defined scenario for this specific call
  call_scenario TEXT,

  start_time TEXT,
  end_time TEXT,
  duration INTEGER,
  cost REAL,
  sid TEXT,
  transcript TEXT,
  error_message TEXT,
  payment_intent_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (persona_id) REFERENCES personas(id) ON DELETE SET NULL
);
```

### **New Table: `call_scenario_templates` (Optional - For Reusable Scenarios)**

```sql
CREATE TABLE IF NOT EXISTS call_scenario_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  scenario_text TEXT NOT NULL,
  icon TEXT DEFAULT '🎭',
  use_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scenario_templates_user ON call_scenario_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_scenario_templates_use_count ON call_scenario_templates(use_count DESC);
```

**Examples of saved templates:**
- 💼 "Emergency Work Call" - "You're my boss calling about urgent project deadline"
- 💔 "Save Me From Bad Date" - "Fake emergency to rescue me from boring date"
- 🎉 "Party Planning" - "We're planning surprise birthday party for mutual friend"
- 🐕 "Sick Pet Emergency" - "Our dog is sick, sound very concerned"

---

## 🔄 Updated Flow: Triggering a Call with Scenario

### **A. Frontend Flow (Vue.js):**

#### **1. User Interface - Two Options:**

**Option 1: Quick Call (No Scenario)**
```vue
<!-- src/views/DashboardView.vue -->
<template>
  <div class="persona-card">
    <h3>{{ persona.name }}</h3>
    <p>{{ persona.description }}</p>

    <!-- Quick call button -->
    <button @click="quickCall(persona.id)">
      📞 Call Me Now
    </button>

    <!-- Advanced call button -->
    <button @click="openScenarioDialog(persona.id)">
      🎭 Call with Scenario
    </button>
  </div>
</template>

<script>
async quickCall(personaId) {
  // No scenario - just trigger call
  await callsStore.initiateCall(personaId, user.phone, null);
}

function openScenarioDialog(personaId) {
  // Show scenario input modal
  showScenarioModal.value = true;
  selectedPersona.value = personaId;
}
</script>
```

**Option 2: Call with Scenario Dialog**
```vue
<!-- src/components/CallScenarioDialog.vue -->
<template>
  <dialog v-if="isOpen" class="scenario-dialog">
    <h2>Set the Scene for {{ persona.name }}</h2>

    <!-- Saved templates (quick select) -->
    <div class="templates" v-if="templates.length > 0">
      <h3>Quick Scenarios:</h3>
      <button
        v-for="template in templates"
        :key="template.id"
        @click="useTemplate(template)"
        class="template-chip"
      >
        {{ template.icon }} {{ template.name }}
      </button>
    </div>

    <!-- Custom scenario input -->
    <div class="custom-scenario">
      <h3>Or Write Your Own:</h3>
      <textarea
        v-model="scenario"
        placeholder="Describe the situation for this call...

Examples:
• 'Call to save me from a boring meeting - pretend it's urgent work stuff'
• 'We're planning a surprise party for Sarah, act excited'
• 'You're calling about our fake sick dog to get me out of this date'"
        rows="6"
        maxlength="500"
      ></textarea>
      <p class="char-count">{{ scenario.length }}/500</p>
    </div>

    <!-- Save as template option -->
    <div class="save-template" v-if="scenario.length > 20">
      <label>
        <input type="checkbox" v-model="saveAsTemplate">
        Save this scenario for future use
      </label>
      <input
        v-if="saveAsTemplate"
        v-model="templateName"
        placeholder="Template name (e.g., 'Bad Date Rescue')"
        maxlength="50"
      >
    </div>

    <!-- Cost estimate with scenario -->
    <div class="cost-estimate">
      <p>Estimated cost: <strong>${{ estimatedCost }}</strong></p>
      <p class="note" v-if="scenario.length > 200">
        ℹ️ Longer scenarios may slightly increase AI costs
      </p>
    </div>

    <!-- Action buttons -->
    <div class="actions">
      <button @click="close()" class="secondary">Cancel</button>
      <button @click="initiateCall()" class="primary">
        📞 Start Call
      </button>
    </div>
  </dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useCallsStore } from '@/stores/calls';
import { useUserStore } from '@/stores/user';

const callsStore = useCallsStore();
const userStore = useUserStore();

const scenario = ref('');
const saveAsTemplate = ref(false);
const templateName = ref('');
const templates = ref([]);

// Load user's saved templates
async function loadTemplates() {
  const response = await api.get('/api/user/call-scenarios', {
    headers: { Authorization: `Bearer ${authStore.token}` }
  });
  templates.value = response.data.templates;
}

function useTemplate(template) {
  scenario.value = template.scenario_text;
}

const estimatedCost = computed(() => {
  // Estimate includes extra tokens for scenario
  const baseTokens = 2000;
  const scenarioTokens = Math.ceil(scenario.value.length / 4);
  const totalTokens = baseTokens + scenarioTokens;

  return callsStore.estimateCost(selectedPersona.value, 5, totalTokens);
});

async function initiateCall() {
  // Save template if requested
  if (saveAsTemplate.value && templateName.value) {
    await api.post('/api/user/call-scenarios', {
      name: templateName.value,
      scenario_text: scenario.value
    }, {
      headers: { Authorization: `Bearer ${authStore.token}` }
    });
  }

  // Trigger call with scenario
  await callsStore.initiateCall(
    selectedPersona.value,
    userStore.currentUser.phone,
    scenario.value.trim() || null
  );

  close();
}
</script>
```

#### **2. Updated Store Method:**

```javascript
// src/stores/calls.js

async initiateCall(personaId, phoneNumber, callScenario = null) {
  // Step 1: Estimate cost (including scenario tokens if provided)
  const scenarioTokens = callScenario ? Math.ceil(callScenario.length / 4) : 0;
  const estimate = await this.estimateCost(personaId, 5, 2000 + scenarioTokens);

  // Step 2: Create payment intent
  const paymentIntent = await userStore.createPaymentIntent(5);

  // Step 3: Show confirmation with scenario preview
  const confirmed = await confirmDialog({
    title: 'Start Call?',
    cost: estimate.total_cents,
    scenario: callScenario,
    message: callScenario
      ? `Your scenario: "${callScenario}"\n\nEstimated cost: $${(estimate.total_cents / 100).toFixed(2)}`
      : `Estimated cost: $${(estimate.total_cents / 100).toFixed(2)}`
  });

  if (!confirmed) return;

  // Step 4: Trigger call with scenario
  const response = await api.post('/api/call', {
    persona_id: personaId,
    phone_number: phoneNumber,
    payment_intent_id: paymentIntent.id,
    call_scenario: callScenario // NEW FIELD
  }, {
    headers: { Authorization: `Bearer ${authStore.token}` }
  });

  return response.data;
}
```

---

### **B. Backend Flow (Raindrop Services):**

#### **1. API Endpoint Update:**

```typescript
// src/call-orchestrator/index.ts

interface InitiateCallInput {
  userId: string;
  personaId: string;
  phoneNumber: string;
  paymentIntentId: string;
  callScenario?: string; // NEW: Optional scenario
}

async initiateCall(input: InitiateCallInput): Promise<{ call_id: string; status: string }> {
  // ... existing validation ...

  // Step 3: Create call record WITH SCENARIO
  const callId = crypto.randomUUID();
  await executeSQL(
    this.env.CALL_ME_BACK_DB,
    `INSERT INTO calls (
      id, user_id, persona_id, phone_number, status,
      payment_intent_id, call_scenario
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      callId,
      input.userId,
      input.personaId,
      input.phoneNumber,
      'pending',
      input.paymentIntentId,
      input.callScenario || null // NEW
    ]
  );

  // ... existing cost tracker initialization ...

  // Step 6: Build composite system prompt WITH SCENARIO
  const persona = await this.getPersona(input.personaId);
  const systemPrompt = await relManager.buildCompositePrompt(
    input.userId,
    input.personaId,
    persona.system_prompt,
    persona.personality_traits,
    input.callScenario // NEW: Pass scenario to prompt builder
  );

  // Step 7: Store prompt in SmartMemory
  await this.env.CONVERSATION_MEMORY.set(`call_session:${callId}`, {
    session_id: callId,
    user_id: input.userId,
    persona_id: input.personaId,
    relationship_id: relationship.id,
    system_prompt: systemPrompt.full_prompt,
    call_scenario: input.callScenario, // NEW: Store scenario
    conversation_history: [],
    current_context: {}
  });

  // ... rest of function ...
}
```

#### **2. Updated Prompt Builder:**

```typescript
// src/shared/persona-relationship.ts

async buildCompositePrompt(
  userId: string,
  personaId: string,
  corePrompt: string,
  personalityTraits: Record<string, any>,
  callScenario?: string, // NEW PARAMETER
  tokenBudget: number = 4300
): Promise<CompositePrompt> {
  const relationship = await this.getOrCreateRelationship(userId, personaId);
  const longTermMemory = await this.getLongTermMemory(userId, personaId);
  const recentContext = await this.getRecentContext(userId, personaId);

  const sections: string[] = [];

  // Core identity (always included)
  sections.push('=== CORE IDENTITY ===');
  sections.push(corePrompt);
  sections.push('');

  // Relationship context
  sections.push('=== YOUR RELATIONSHIP WITH THIS USER ===');
  if (relationship.custom_system_prompt) {
    sections.push(relationship.custom_system_prompt);
  } else {
    sections.push(`You and the user are ${relationship.relationship_type}s.`);
  }
  sections.push('');

  // User facts from long-term memory
  if (longTermMemory && Object.keys(longTermMemory.user_facts).length > 0) {
    sections.push('=== WHAT YOU KNOW ABOUT THE USER ===');
    for (const [key, value] of Object.entries(longTermMemory.user_facts)) {
      sections.push(`- ${key}: ${JSON.stringify(value)}`);
    }
    sections.push('');
  }

  // Inside jokes
  if (longTermMemory && longTermMemory.inside_jokes.length > 0) {
    sections.push('=== INSIDE JOKES YOU SHARE ===');
    longTermMemory.inside_jokes.forEach(joke => {
      sections.push(`- ${joke}`);
    });
    sections.push('');
  }

  // Recent context
  if (recentContext && recentContext.recent_calls && recentContext.recent_calls.length > 0) {
    sections.push('=== RECENT CONTEXT ===');
    const lastCall = recentContext.recent_calls[0];
    sections.push(`Last call (${formatTimeAgo(lastCall.date)}): ${lastCall.summary}`);
    sections.push('');
  }

  // *** NEW: CALL SCENARIO (Priority - comes before conversation style) ***
  if (callScenario && callScenario.trim().length > 0) {
    sections.push('=== THIS CALL\'S SCENARIO (IMPORTANT!) ===');
    sections.push(callScenario.trim());
    sections.push('');
    sections.push('CRITICAL: The user has set up a specific scenario for this call.');
    sections.push('Follow the scenario exactly. Stay in character and play along.');
    sections.push('');
  }

  // Conversation style
  if (personalityTraits) {
    sections.push('=== CONVERSATION STYLE ===');
    for (const [key, value] of Object.entries(personalityTraits)) {
      sections.push(`- ${key}: ${value}`);
    }
    sections.push('');
  }

  // Task (updated to mention scenario if present)
  sections.push('=== YOUR TASK ===');
  if (callScenario) {
    sections.push('The user is calling you for a SPECIFIC SCENARIO (see above).');
    sections.push('Stay in character and play along with the scenario naturally.');
    sections.push('Make it believable - act like this scenario is real.');
  } else {
    sections.push('The user is calling you right now. Respond naturally as this persona.');
  }

  const fullPrompt = sections.join('\n');
  const tokenCount = Math.ceil(fullPrompt.length / 4);

  // Check if over budget
  if (tokenCount > tokenBudget) {
    this.env.logger.warn('Prompt exceeds token budget', {
      tokenCount,
      tokenBudget,
      hasScenario: !!callScenario
    });
  }

  return {
    core_prompt: corePrompt,
    relationship_context: relationship.custom_system_prompt || `${relationship.relationship_type} relationship`,
    user_facts: longTermMemory ? JSON.stringify(longTermMemory.user_facts) : '{}',
    recent_context: recentContext ? JSON.stringify(recentContext.recent_calls?.[0]) : '{}',
    call_scenario: callScenario || null, // NEW
    full_prompt: fullPrompt,
    token_count: tokenCount
  };
}

interface CompositePrompt {
  core_prompt: string;
  relationship_context: string;
  user_facts: string;
  recent_context: string;
  call_scenario: string | null; // NEW
  full_prompt: string;
  token_count: number;
}
```

---

## 📝 Example Scenarios & How They Work

### **Example 1: "Save Me From Bad Date"**

**User Input:**
```
Call to rescue me from a terrible date. Pretend we need to discuss
urgent apartment issues - broken pipe flooding the kitchen. Sound
very concerned and convincing.
```

**Generated System Prompt:**
```
=== CORE IDENTITY ===
You are Brad - a decisive, confident guy who doesn't sugarcoat things...

=== YOUR RELATIONSHIP WITH THIS USER ===
You and Alice are close bros from college. You met at a party in 2020.

=== WHAT YOU KNOW ABOUT ALICE ===
- job: Software Engineer at TechCorp
- apartment: Lives downtown, 2BR with roommate Jessica

=== THIS CALL'S SCENARIO (IMPORTANT!) ===
Call to rescue me from a terrible date. Pretend we need to discuss
urgent apartment issues - broken pipe flooding the kitchen. Sound
very concerned and convincing.

CRITICAL: The user has set up a specific scenario for this call.
Follow the scenario exactly. Stay in character and play along.

=== YOUR TASK ===
The user is calling you for a SPECIFIC SCENARIO (see above).
Stay in character and play along with the scenario naturally.
Make it believable - act like this scenario is real.
```

**AI Response When Alice Answers:**
```
"Alice! Oh thank god you picked up. Listen, I just got back to your
place and there's water EVERYWHERE - I think a pipe burst under the
kitchen sink. Like, it's bad. You need to get back here right now
before it floods the whole apartment. Can you leave?"
```

---

### **Example 2: "Boss Emergency Call"**

**User Input:**
```
You're my boss Marcus calling about a critical production bug.
Act professional and urgent - say we need me on a call with the
client ASAP.
```

**AI Adapts Persona:**
- Even if Brad is normally casual, he'll adopt a professional tone
- Uses user's boss name from long-term memory
- Creates believable work emergency

**AI Response:**
```
"Hey, it's Marcus. Sorry to interrupt your evening, but we've got
a situation. The client just reported that the payment system is
down and we're losing transactions. I need you on a bridge call
with their CTO in 15 minutes. Can you get to a computer?"
```

---

### **Example 3: "Party Planning"**

**User Input:**
```
We're planning Sarah's surprise 30th birthday party. Act excited
and ask about venue options. We're thinking about that rooftop
bar downtown.
```

**AI Response:**
```
"Yo! So I've been thinking about Sarah's party - that rooftop bar
idea is PERFECT. She'd love that vibe. Did you check if they can
do private events? We should probably book soon since her birthday's
only 3 weeks out, right?"
```

---

## 🎨 UI/UX Considerations

### **When to Show Scenario Option:**

**Always Available:**
- Dashboard "Call Me Now" has dropdown: "Quick Call" vs "Call with Scenario"
- Persona detail page has both buttons
- Scheduled calls always show scenario field

**Quick Access to Templates:**
- After using a scenario 3+ times, prompt: "Save this as a template?"
- Templates show in a carousel/chips for 1-click selection
- Most-used templates appear first

### **Visual Indicators:**

**Call History:**
```
📞 Call with Brad - 5:23 PM (2 min, $1.85)
   🎭 Scenario: "Bad date rescue - apartment emergency"
   ⭐ Rating: Worked perfectly!
```

**Active Call Banner:**
```
🎭 Active Scenario: "Boss calling about urgent project"
💰 Current Cost: $1.23
⏱️ Duration: 1:45
```

---

## 🔌 New API Endpoints

### **1. Get User's Scenario Templates**
```
GET /api/user/call-scenarios

Headers:
  Authorization: Bearer <token>

Response:
{
  "templates": [
    {
      "id": "template_123",
      "name": "Bad Date Rescue",
      "scenario_text": "Call to save me from boring date...",
      "icon": "💔",
      "use_count": 12,
      "created_at": "2025-01-01T10:00:00Z"
    }
  ]
}
```

### **2. Create Scenario Template**
```
POST /api/user/call-scenarios

Headers:
  Authorization: Bearer <token>

Body:
{
  "name": "Work Emergency",
  "scenario_text": "You're my boss calling about urgent bug",
  "icon": "💼"
}

Response:
{
  "id": "template_456",
  "name": "Work Emergency",
  "scenario_text": "You're my boss calling about urgent bug",
  "icon": "💼",
  "use_count": 0,
  "created_at": "2025-01-07T12:00:00Z"
}
```

### **3. Update/Delete Template**
```
PUT /api/user/call-scenarios/:id
DELETE /api/user/call-scenarios/:id
```

### **4. Increment Template Usage**
```
POST /api/user/call-scenarios/:id/use

(Called automatically when template is used for a call)
```

---

## 💾 Data Flow Summary

### **Before Call:**
1. User writes scenario: "Save me from bad date - fake apartment flood"
2. Frontend sends to backend in `POST /api/call` body
3. Backend stores in `calls.call_scenario` column
4. Backend builds prompt including scenario in priority section
5. Prompt stored in SmartMemory `call_session:{callId}`

### **During Call:**
1. Voice pipeline loads session from SmartMemory
2. System prompt includes scenario instructions
3. AI follows scenario naturally
4. Scenario context maintained throughout conversation

### **After Call:**
1. Transcript saved to SmartBuckets with scenario metadata
2. Short-term memory updated: "Call with scenario: [name]"
3. Template usage count incremented if template was used
4. User can rate: "Did the scenario work well?"

---

## 📊 Cost Impact

### **Token Usage:**
- **Short scenario** (50 chars): ~12 tokens → negligible cost (~$0.0001)
- **Medium scenario** (200 chars): ~50 tokens → ~$0.0005
- **Long scenario** (500 chars): ~125 tokens → ~$0.0013

**Impact:** Minimal - scenarios are worth the cost for UX improvement.

**UI Warning:**
- Show if scenario >200 chars: "ℹ️ Longer scenarios may slightly increase costs"
- Include in pre-call estimate

---

## ✅ Implementation Checklist

### **Database:**
- [ ] Add `call_scenario TEXT` to `calls` table
- [ ] Create `call_scenario_templates` table
- [ ] Run migration

### **Backend:**
- [ ] Update `InitiateCallInput` interface with `callScenario` field
- [ ] Modify `buildCompositePrompt()` to include scenario
- [ ] Update call creation SQL to store scenario
- [ ] Add scenario templates API endpoints

### **Frontend:**
- [ ] Create `CallScenarioDialog.vue` component
- [ ] Update `DashboardView.vue` with scenario button
- [ ] Add template management UI
- [ ] Update cost estimation to include scenario tokens
- [ ] Add scenario indicator in call history

### **Testing:**
- [ ] Test call with scenario vs without
- [ ] Verify AI follows scenario instructions
- [ ] Test template save/load
- [ ] Verify cost tracking includes scenario tokens
- [ ] Test scenario in call history/transcript

---

## 🎯 User Benefits

1. **Flexibility:** Same persona can handle different situations
2. **Realism:** Scenarios make rescue calls more believable
3. **Creativity:** Users can craft elaborate scenarios
4. **Efficiency:** Saved templates for repeat scenarios
5. **Fun:** Makes the app more engaging and versatile

---

## 🚀 Future Enhancements

### **Phase 2:**
- **Scenario marketplace:** Share popular scenarios
- **AI-suggested scenarios:** Based on time/location/calendar
- **Voice scenario briefing:** AI confirms scenario before call starts
- **Scenario effectiveness tracking:** "This scenario worked!" ratings

### **Phase 3:**
- **Multi-persona scenarios:** Coordinate multiple personas
- **Time-delayed scenarios:** "Call me in 20 minutes if I don't cancel"
- **Context-aware scenarios:** Auto-suggest based on calendar/location

---

**This feature transforms "Call Me Back" from a simple AI caller into a versatile social tool!** 🎭
