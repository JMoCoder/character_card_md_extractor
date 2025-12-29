
export interface CharacterMetadata {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  creator_notes?: string;
  system_prompt?: string;
  post_history_instructions?: string;
  tags?: string[];
  creator?: string;
  character_version?: string;
}

export interface TavernCardData {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  // Added V1 optional fields to root level for compatibility
  creator_notes?: string;
  system_prompt?: string;
  post_history_instructions?: string;
  tags?: string[];
  metadata?: {
    version?: number;
    created?: number;
    modified?: number;
    source?: string;
  };
  data?: CharacterMetadata; // For V2 spec
}
