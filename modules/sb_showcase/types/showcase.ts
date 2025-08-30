// SB Showcase Types
export interface SBModule {
  id: string;
  name: string;
  description: string;
  version: string;
  features: string[];
  components: string[];
  codeExample: string;
  npmPackage?: string;
  githubUrl?: string;
  documentation?: string;
}

export interface SBUseCase {
  title: string;
  description: string;
  modules: string[];
  features: string[];
  estimatedTime?: string;
  complexity?: 'beginner' | 'intermediate' | 'advanced';
}

export interface SBShowcaseConfig {
  appName: string;
  modules: SBModule[];
  useCases: SBUseCase[];
  githubBaseUrl?: string;
  documentationUrl?: string;
}