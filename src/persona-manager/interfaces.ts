// Persona Manager Type Definitions

export interface Persona {
  id: string;
  name: string;
  description: string;
  voice: string;
  systemPrompt: string;
  isPublic: boolean;
  createdBy: string;
  tags?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonaInput {
  name: string;
  description: string;
  voice: string;
  systemPrompt: string;
  isPublic?: boolean;
  tags?: string;
}

export interface UpdatePersonaInput {
  name?: string;
  description?: string;
  voice?: string;
  systemPrompt?: string;
  isPublic?: boolean;
  tags?: string;
}

export interface Contact {
  id: string;
  userId: string;
  personaId: string;
  addedAt: string;
}
