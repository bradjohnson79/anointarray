// MCP Server Type Definitions for ANOINT Array

export interface MCPServerConfig {
  enabled: boolean;
  port: number;
  name: string;
  tools: string[];
  priority: number;
}

export interface MCPConfig {
  version: string;
  project: string;
  environment: 'development' | 'staging' | 'production';
  servers: Record<string, MCPServerConfig>;
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    destinations: string[];
  };
  security: {
    require_auth: boolean;
    rate_limiting: boolean;
    cors_enabled: boolean;
    allowed_origins: string[];
  };
  features: {
    auto_deployment: boolean;
    parallel_processing: boolean;
    error_recovery: boolean;
    performance_monitoring: boolean;
    ai_assistance: boolean;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (params: any) => Promise<any>;
}

export interface MCPServer {
  name: string;
  version: string;
  port: number;
  tools: MCPTool[];
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  health(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>;
}

// Supabase MCP Types
export interface SupabaseMigration {
  id: string;
  name: string;
  sql: string;
  rollback?: string;
  applied: boolean;
  created_at: string;
}

export interface DatabaseSchema {
  tables: DatabaseTable[];
  views: DatabaseView[];
  functions: DatabaseFunction[];
  types: DatabaseType[];
}

export interface DatabaseTable {
  name: string;
  schema: string;
  columns: DatabaseColumn[];
  constraints: DatabaseConstraint[];
  indexes: DatabaseIndex[];
  policies: RLSPolicy[];
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  default?: any;
  primary_key: boolean;
  foreign_key?: ForeignKey;
}

export interface RLSPolicy {
  name: string;
  table: string;
  command: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
  using?: string;
  check?: string;
}

// Vercel MCP Types
export interface VercelDeployment {
  id: string;
  url: string;
  state: 'BUILDING' | 'ERROR' | 'INITIALIZING' | 'QUEUED' | 'READY' | 'CANCELED';
  creator: {
    uid: string;
    username: string;
  };
  created: number;
  target: 'staging' | 'production';
  functions: VercelFunction[];
}

export interface VercelFunction {
  path: string;
  runtime: string;
  memory: number;
  maxDuration: number;
}

// GitHub MCP Types
export interface GitHubPullRequest {
  number: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  mergeable: boolean;
  head: {
    ref: string;
    sha: string;
  };
  base: {
    ref: string;
    sha: string;
  };
  checks: GitHubCheck[];
}

export interface GitHubCheck {
  name: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out';
}

// Stripe MCP Types
export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled';
  customer?: string;
  metadata: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customer: string;
  status: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete';
  current_period_start: number;
  current_period_end: number;
  items: StripeSubscriptionItem[];
}

export interface StripeSubscriptionItem {
  id: string;
  price: {
    id: string;
    unit_amount: number;
    currency: string;
    recurring: {
      interval: 'month' | 'year';
      interval_count: number;
    };
  };
}

// Redis MCP Types
export interface RedisConfig {
  url: string;
  token?: string;
  database?: number;
  keyPrefix?: string;
}

export interface CacheStrategy {
  key: string;
  ttl: number;
  strategy: 'write-through' | 'write-behind' | 'cache-aside';
  tags: string[];
}

// Monitoring MCP Types
export interface ErrorEvent {
  id: string;
  message: string;
  stack: string;
  level: 'error' | 'warning' | 'info';
  timestamp: string;
  user?: {
    id: string;
    email: string;
  };
  context: Record<string, any>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags: Record<string, string>;
}

// Build and Deployment Types
export interface BuildConfig {
  commands: string[];
  env: Record<string, string>;
  outputDirectory: string;
  installCommand?: string;
  buildCommand?: string;
  devCommand?: string;
}

export interface DeploymentConfig {
  target: 'preview' | 'production';
  branch?: string;
  regions: string[];
  functions?: Record<string, any>;
  routes?: Route[];
}

export interface Route {
  src: string;
  dest: string;
  methods?: string[];
  headers?: Record<string, string>;
}