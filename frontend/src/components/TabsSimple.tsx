type TabId = "BUYERS" | "SELLERS";

type Props = {
  active: TabId;
  onChange(tab: TabId): void;
};

export default function TabsSimple({ active, onChange }: Props) {
  const tabs: { id: TabId; label: string }[] = [
    { id: "BUYERS", label: "Buyers" },
    { id: "SELLERS", label: "Sellers" },
  ];
  return (
    <div className="flex justify-center gap-3 py-4">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-full px-5 py-2 border ${
            active === t.id ? "bg-arcCard border-arcAccent" : "bg-slate-900/70 border-slate-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}


