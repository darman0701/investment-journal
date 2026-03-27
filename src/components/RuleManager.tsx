"use client";
import { useState } from "react";
import { InvestmentRule } from "@/lib/types";
import { generateId } from "@/lib/utils";

interface Props {
  rules: InvestmentRule[];
  onAdd: (rule: InvestmentRule) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function RuleManager({ rules, onAdd, onToggle, onDelete }: Props) {
  const [newRule, setNewRule] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.trim()) return;
    onAdd({ id: generateId(), rule: newRule.trim(), active: true, createdAt: new Date().toISOString() });
    setNewRule("");
  };

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-5">
        <input
          value={newRule}
          onChange={(e) => setNewRule(e.target.value)}
          placeholder="ルールを追加"
          className="flex-1 text-[12px]"
        />
        <button type="submit" className="px-4 py-2 bg-primary text-white text-[11px] rounded-lg whitespace-nowrap">
          追加
        </button>
      </form>

      {rules.length === 0 ? (
        <div className="text-center py-16"><p className="text-[12px] text-muted">投資ルールを登録して規律を守る</p></div>
      ) : (
        <div className="space-y-px">
          {rules.map((rule) => (
            <div key={rule.id} className={`flex items-center gap-3 py-3 border-b border-border/50 last:border-0 ${!rule.active ? "opacity-40" : ""}`}>
              <button
                onClick={() => onToggle(rule.id)}
                className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                  rule.active ? "bg-success border-success" : "border-muted"
                }`}
              >
                {rule.active && <span className="text-white text-[9px]">&#10003;</span>}
              </button>
              <span className={`flex-1 text-[12px] leading-relaxed ${!rule.active ? "line-through" : ""}`}>{rule.rule}</span>
              <button onClick={() => onDelete(rule.id)} className="text-[11px] text-muted hover:text-danger transition">削除</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
