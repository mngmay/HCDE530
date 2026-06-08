export type InfluenceLevel = 'high' | 'medium' | 'low';
export type InterestLevel = 'high' | 'medium' | 'low';
export type Stance = 'supporter' | 'neutral' | 'blocker' | 'unknown';
export type InsightType = 'summary' | 'recommendation' | 'risk';
export type SessionStatus = 'active' | 'completed';

export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  rules: string | null;
  created_at: string;
  updated_at: string;
}

export interface StakeholderBrief {
  executive_summary: string;
  key_messages: string[];
  communication_approach: string;
  talking_points: string[];
  things_to_avoid: string[];
  generated_at: string;
}

export interface Stakeholder {
  id: string;
  project_id: string;
  name: string;
  role: string;
  organization: string | null;
  influence_level: InfluenceLevel;
  interest_level: InterestLevel;
  stance: Stance;
  notes: string | null;
  profile_data: StakeholderProfileData | null;
  stakeholder_brief: StakeholderBrief | null;
  created_at: string;
  updated_at: string;
}

export interface StakeholderProfileData {
  key_priorities: string[];
  potential_concerns: string[];
  influence_patterns: string;
  engagement_recommendations: string[];
  risk_assessment: string;
  summary: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface InterviewSession {
  id: string;
  stakeholder_id: string;
  messages: ChatMessage[];
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface Insight {
  id: string;
  project_id: string;
  content: string;
  type: InsightType;
  created_at: string;
}

export interface ResearchDocument {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  source: string | null;
  created_at: string;
  updated_at: string;
}
