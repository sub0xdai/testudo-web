export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface LoginResponse {
  user: { id: string; email: string };
  tokens: AuthTokens;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface ExchangeInfo {
  id: string;
  name: string;
  type: string;
  description: string;
  supported_features: string[];
  required_credentials: string[];
  optional_credentials: string[];
}

export interface ExchangeAccount {
  id: string;
  exchange_name: string;
  account_name: string;
  is_active: boolean;
  permissions: Record<string, unknown>;
  created_at: string;
  last_used_at: string | null;
  auth_mode: string;
  wallet_address?: string;
}

export interface AddExchangeAccountPayload {
  exchange_name: string;
  account_name?: string;
  api_key: string;
  secret: string;
  passphrase?: string;
}

export interface InitAgentWalletResponse {
  account_id: string;
  agent_address: string;
}

export interface ApproveDataResponse {
  typed_data: Record<string, unknown>;
  nonce: number;
  agent_address: string;
}

export interface ApproveAgentResponse {
  success: boolean;
  agent_address: string;
  message: string;
}

export interface TestConnectionResult {
  account_id: string;
  exchange_name: string;
  status: string;
  message: string;
  tested_at: string;
  latency_ms: number | null;
}
