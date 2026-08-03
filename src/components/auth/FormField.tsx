'use client';

export function FormField({ label, placeholder, value, onChange, type = 'text', optional = false }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label} {optional && <span className="text-muted-foreground/50">(optional)</span>}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-gold transition-colors"
      />
    </div>
  );
}

export function SelectField({ label, placeholder, value, onChange, options }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-surface border border-surface-border px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold transition-colors appearance-none"
      >
        <option value="" className="bg-surface text-muted-foreground">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-surface text-white">{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
