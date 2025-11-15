type Tab = {
  id: "SELLER" | "BUYER";
  label: string;
  hint: string;
};

const TABS: Tab[] = [
  { id: "BUYER", label: "Buyer Panel", hint: "Browse listings & confirm payments" },
  { id: "SELLER", label: "Seller Panel", hint: "Post liquidity & release funds" },
];

type Props = {
  active: Tab["id"];
  onChange(tab: Tab["id"]): void;
};

export function Tabs({ active, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 min-w-[220px] rounded-2xl border px-4 py-4 text-left transition ${
            active === tab.id ? "bg-arcCard border-arcAccent" : "bg-slate-900/70 border-slate-800"
          }`}
        >
          <div className="text-xs uppercase tracking-wide text-slate-400">{tab.label}</div>
          <div className="text-lg font-semibold">{tab.hint}</div>
        </button>
      ))}
    </div>
  );
}

