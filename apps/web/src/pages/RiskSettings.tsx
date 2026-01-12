import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getRiskConfig, updateRiskConfig, RiskConfig } from "../utils/requests";

// Default values matching backend RiskConfig::default()
const DEFAULT_CONFIG: RiskConfig = {
  account_risk_percent: "2",
  max_risk_amount: null,
  max_position_size: null,
  max_leverage: 1,
  daily_max_drawdown_percent: "5",
  max_open_positions: 5,
  require_stop_loss: true,
  default_stop_atr_multiplier: "2",
  min_risk_reward_ratio: "1.5",
};

export const RiskSettings = () => {
  const [config, setConfig] = useState<RiskConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await getRiskConfig();
      setConfig(data);
    } catch {
      toast.error("Failed to load risk settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateRiskConfig(config);
      setConfig(updated);
      toast.success("Risk settings saved");
    } catch {
      toast.error("Failed to save risk settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof RiskConfig, value: string | number | boolean | null) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-main-bg flex items-center justify-center">
        <div className="text-text-secondary font-imperial text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main-bg p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-imperial font-bold text-text-default tracking-wider uppercase">
            Risk Settings
          </h1>
          <p className="mt-2 text-sm text-text-secondary font-mono">
            Configure your position sizing and risk management parameters
          </p>
        </header>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Account Risk Section */}
          <section className="bg-container-bg rounded-xl border border-container-border p-6">
            <h2 className="text-sm font-imperial font-semibold text-text-default uppercase tracking-wider mb-4">
              Position Sizing
            </h2>

            <div className="space-y-4">
              <InputField
                label="Account Risk Per Trade (%)"
                value={config.account_risk_percent ?? ""}
                onChange={(v) => handleChange("account_risk_percent", v)}
                placeholder="2"
                hint="Maximum percentage of account to risk per trade"
              />

              <InputField
                label="Max Risk Amount ($)"
                value={config.max_risk_amount ?? ""}
                onChange={(v) => handleChange("max_risk_amount", v || null)}
                placeholder="Optional"
                hint="Maximum dollar amount to risk per trade"
              />

              <InputField
                label="Max Position Size"
                value={config.max_position_size ?? ""}
                onChange={(v) => handleChange("max_position_size", v || null)}
                placeholder="Optional"
                hint="Maximum position size in base currency (e.g., 0.5 BTC)"
              />

              <InputField
                label="Max Leverage"
                value={String(config.max_leverage)}
                onChange={(v) => handleChange("max_leverage", parseInt(v) || 1)}
                placeholder="1"
                hint="Maximum leverage allowed (1 = no leverage)"
                type="number"
              />
            </div>
          </section>

          {/* Risk Controls Section */}
          <section className="bg-container-bg rounded-xl border border-container-border p-6">
            <h2 className="text-sm font-imperial font-semibold text-text-default uppercase tracking-wider mb-4">
              Risk Controls
            </h2>

            <div className="space-y-4">
              <InputField
                label="Daily Max Drawdown (%)"
                value={config.daily_max_drawdown_percent ?? ""}
                onChange={(v) => handleChange("daily_max_drawdown_percent", v || null)}
                placeholder="5"
                hint="Block trading after this daily drawdown percentage"
              />

              <InputField
                label="Max Open Positions"
                value={String(config.max_open_positions ?? "")}
                onChange={(v) => handleChange("max_open_positions", parseInt(v) || null)}
                placeholder="5"
                hint="Maximum number of concurrent open positions"
                type="number"
              />

              <ToggleField
                label="Require Stop Loss"
                value={config.require_stop_loss}
                onChange={(v) => handleChange("require_stop_loss", v)}
                hint="Reject orders without a stop loss price"
              />

              <InputField
                label="Min Risk/Reward Ratio"
                value={config.min_risk_reward_ratio ?? ""}
                onChange={(v) => handleChange("min_risk_reward_ratio", v || null)}
                placeholder="1.5"
                hint="Minimum risk/reward ratio required for trades"
              />

              <InputField
                label="Default Stop (ATR Multiplier)"
                value={config.default_stop_atr_multiplier ?? ""}
                onChange={(v) => handleChange("default_stop_atr_multiplier", v || null)}
                placeholder="2"
                hint="Default stop-loss distance as ATR multiplier"
              />
            </div>
          </section>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-steel-primary text-main-bg font-imperial font-semibold
                         text-xs tracking-wider uppercase rounded-lg
                         hover:bg-steel-secondary transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed
                         focus:outline-none focus:ring-2 focus:ring-steel-primary/50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Input Field Component
function InputField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  type?: "text" | "number";
}) {
  return (
    <div>
      <label className="block text-xs font-imperial font-medium text-text-default uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-main-bg border border-container-border rounded-lg
                   text-text-default font-numeral text-sm
                   placeholder:text-text-tertiary
                   focus:outline-none focus:ring-1 focus:ring-steel-primary/50 focus:border-steel-primary/50
                   transition-colors"
      />
      {hint && (
        <p className="mt-1 text-xs text-text-tertiary font-mono">{hint}</p>
      )}
    </div>
  );
}

// Toggle Field Component
function ToggleField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <label className="block text-xs font-imperial font-medium text-text-default uppercase tracking-wider">
          {label}
        </label>
        {hint && (
          <p className="mt-0.5 text-xs text-text-tertiary font-mono">{hint}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`
          relative w-11 h-6 rounded-full transition-colors
          focus:outline-none focus:ring-2 focus:ring-steel-primary/50
          ${value ? "bg-steel-primary" : "bg-container-border"}
        `}
      >
        <span
          className={`
            absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform
            ${value ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  );
}
