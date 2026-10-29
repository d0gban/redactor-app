import { Download, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES, CUSTOM_CATEGORY } from "@/engine/detectors.js";
import { resolveEntity, type Redactor } from "@/hooks/useRedactor";
import { CUSTOM_NAME_MAX, ENTITY_OPTIONS, entityLabel } from "@/lib/entities";
import type { TermItem } from "@/lib/prefs";
import { plural, preview } from "@/lib/text";
import { cn } from "@/lib/utils";

const GROUP_ORDER = [CUSTOM_CATEGORY, ...CATEGORIES];

// Tablet widths lay the sections out side by side under the editors; wider screens stack them in a sidebar.
const sectionClasses =
  "grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3 border-b p-4 last:border-b-0 lg:max-xl:overflow-y-auto lg:max-xl:border-r lg:max-xl:border-b-0 lg:max-xl:last:border-r-0";

function SectionTitle({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-sm font-semibold">
      {children}
    </h2>
  );
}

function Swatch({ off = false }: { off?: boolean }) {
  return <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-[2px] bg-(--cat)", off && "opacity-30")} />;
}

function TermChip({ term, r }: { term: TermItem; r: Redactor }) {
  const options = ENTITY_OPTIONS.some(([value]) => value === term.entity)
    ? ENTITY_OPTIONS
    : [...ENTITY_OPTIONS, [term.entity, entityLabel(term.entity)] as const];
  const flags = [term.caseSensitive ? "Aa" : "", term.wholeWord ? "" : "partial"].filter(Boolean).join(" · ");
  const name = preview(term.value, 60);
  return (
    <li className="cat--custom inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md border border-(--cat)/40 bg-(--cat)/10 py-0.5 pr-0.5 pl-1 text-sm">
      <select
        value={term.entity}
        onChange={(event) => r.changeTermEntity(term.id, event.target.value)}
        aria-label={`Type for ${name}`}
        className="max-w-[45%] shrink-0 truncate rounded-[4px] bg-transparent px-0.5 text-2xs font-semibold tracking-wide text-(--cat) uppercase pointer-coarse:min-h-11"
      >
        {options.map(([value, label]) => (
          <option key={value} value={value} className="bg-popover text-foreground normal-case">
            {label}
          </option>
        ))}
      </select>
      <span className="min-w-0 flex-1 truncate" title={term.value}>
        {preview(term.value, 40)}
      </span>
      {flags ? <span className="shrink-0 text-2xs text-subtle">{flags}</span> : null}
      <button
        type="button"
        onClick={() => r.removeTerm(term.id)}
        aria-label={`Remove ${name}`}
        className="grid size-[22px] shrink-0 place-items-center rounded-[4px] text-muted-foreground hover:bg-destructive/20 hover:text-destructive pointer-coarse:size-11"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </li>
  );
}

function TermsSection({ r }: { r: Redactor }) {
  const [value, setValue] = useState("");
  const { termForm, setTermForm } = r;

  return (
    <section aria-labelledby="terms-title" className={sectionClasses}>
      <SectionTitle id="terms-title">Always redact</SectionTitle>

      <form
        autoComplete="off"
        className="grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (r.addTerm(value)) setValue("");
        }}
      >
        <div className="flex gap-2 max-[560px]:flex-wrap">
          <Label htmlFor="term-value" className="sr-only">
            Term to redact
          </Label>
          <Input
            id="term-value"
            name="value"
            required
            maxLength={200}
            placeholder="Name or company"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="flex-1 max-[560px]:basis-full"
          />
          <Label htmlFor="term-entity" className="sr-only">
            Type
          </Label>
          <NativeSelect
            id="term-entity"
            name="entity"
            value={termForm.entity}
            onChange={(event) => setTermForm({ ...termForm, entity: event.target.value })}
            containerClassName="max-[560px]:flex-1"
            className="max-[560px]:w-full"
          >
            {ENTITY_OPTIONS.map(([entity, label]) => (
              <option key={entity} value={entity}>
                {label}
              </option>
            ))}
          </NativeSelect>
          <Button type="submit" variant="secondary" size="sm" className="h-9">
            Add
          </Button>
        </div>
        {termForm.entity === "CUSTOM" ? (
          <div className="grid gap-1">
            <Label htmlFor="term-custom-name" className="text-xs text-muted-foreground">
              Token name (optional)
            </Label>
            <Input
              id="term-custom-name"
              name="customName"
              maxLength={CUSTOM_NAME_MAX}
              placeholder="e.g. Ticket ID"
              value={termForm.customName}
              onChange={(event) => setTermForm({ ...termForm, customName: event.target.value })}
              aria-describedby="term-custom-hint"
            />
            <p id="term-custom-hint" className="flex flex-wrap justify-between gap-x-2 text-xs text-subtle">
              <span className="min-w-0 [overflow-wrap:anywhere]">
                Becomes <code className="font-mono text-(--cat) cat--custom">[{resolveEntity(termForm)}_1]</code>
              </span>
              <span className="tabular-nums">
                {termForm.customName.length}/{CUSTOM_NAME_MAX}
              </span>
            </p>
          </div>
        ) : null}
        <div className="flex gap-4">
          <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground pointer-coarse:min-h-11">
            <Checkbox checked={termForm.wholeWord} onCheckedChange={(c) => setTermForm({ ...termForm, wholeWord: c === true })} />
            Whole word
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground pointer-coarse:min-h-11">
            <Checkbox checked={termForm.caseSensitive} onCheckedChange={(c) => setTermForm({ ...termForm, caseSensitive: c === true })} />
            Match case
          </label>
        </div>
      </form>

      <ul aria-label="Terms" className="flex min-w-0 flex-wrap gap-1.5">
        {r.terms.length ? (
          r.terms.map((term) => <TermChip key={term.id} term={term} r={r} />)
        ) : (
          <li className="w-full p-3 text-center text-sm text-subtle">
            No terms yet. Add names, companies or projects that pattern detection can&apos;t know about.
          </li>
        )}
      </ul>

      <SavedSettings r={r} />
    </section>
  );
}

/** Everything about keeping settings: remembering them here, or moving them between browsers as a file. */
function SavedSettings({ r }: { r: Redactor }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div role="group" aria-labelledby="saved-settings-title" aria-describedby="saved-settings-hint" className="-mx-4 grid gap-3 border-t px-4 pt-4">
      <div className="grid gap-0.5">
        <h3 id="saved-settings-title" className="text-sm font-semibold">
          Saved settings
        </h3>
        <p id="saved-settings-hint" className="text-xs text-subtle">
          Terms and detector toggles only. Prompt text is never included.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="size-3.5" aria-hidden="true" />
          Import
        </Button>
        <Button variant="outline" size="sm" onClick={r.exportConfig}>
          <Download className="size-3.5" aria-hidden="true" />
          Export
        </Button>
      </div>
      <label className="inline-flex items-center gap-2 text-xs text-muted-foreground pointer-coarse:min-h-11">
        <Switch checked={r.remember} onCheckedChange={r.setRemember} />
        Remember on this device
      </label>
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        aria-label="Settings file to import"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Reset so picking the same file again still fires a change.
          event.target.value = "";
          if (file) void r.importConfig(file);
        }}
      />
    </div>
  );
}

function DetectorsSection({ r }: { r: Redactor }) {
  const counts = new Map<string, number>();
  for (const finding of r.result?.findings ?? []) counts.set(finding.category, (counts.get(finding.category) ?? 0) + 1);

  return (
    <section aria-labelledby="detectors-title" className={sectionClasses}>
      <SectionTitle id="detectors-title">Detectors</SectionTitle>
      <div className="grid gap-0.5">
        {CATEGORIES.map((cat) => {
          const on = r.enabledCategories.has(cat.id);
          return (
            <label
              key={cat.id}
              className={cn(
                `cat--${cat.id}`,
                "grid cursor-pointer grid-cols-[auto_auto_1fr_auto] items-center gap-x-2.5 rounded-md px-2 py-1.5 hover:bg-accent pointer-coarse:min-h-11"
              )}
            >
              <Checkbox checked={on} onCheckedChange={(c) => r.toggleCategory(cat.id, c === true)} />
              <Swatch off={!on} />
              <span className="grid min-w-0">
                <span className="text-sm font-medium">{cat.label}</span>
                <span className="truncate text-xs text-subtle">{cat.hint}</span>
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">{on ? (counts.get(cat.id) ?? 0) : "off"}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

function FindingsSection({ r }: { r: Redactor }) {
  const findings = r.result?.findings ?? [];
  const groups = GROUP_ORDER.map((cat) => ({ cat, items: findings.filter((f) => f.category === cat.id) })).filter((g) => g.items.length);

  return (
    <section aria-labelledby="findings-title" className={cn(sectionClasses, "lg:max-xl:col-span-1")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle id="findings-title">
          Findings <span className="font-medium text-subtle">{findings.length}</span>
        </SectionTitle>
        <div className="flex gap-1">
          <Button variant="ghost" size="xs" onClick={() => r.setAllKept(false)}>
            Redact all
          </Button>
          <Button variant="ghost" size="xs" onClick={() => r.setAllKept(true)}>
            Keep all
          </Button>
        </div>
      </div>

      {groups.length ? (
        <div className="grid min-w-0 gap-3">
          {groups.map(({ cat, items }) => (
            <section key={cat.id} className={cn(`cat--${cat.id}`, "grid min-w-0 gap-0.5")}>
              <h3 className="mb-0.5 flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                <Swatch />
                {cat.label}
                <span className="font-medium text-subtle">
                  {items.filter((f) => !f.excluded).length}/{items.length}
                </span>
              </h3>
              <ul className="grid gap-px">
                {items.map((f) => (
                  <li key={f.key}>
                    <label
                      title={preview(f.value, 200)}
                      className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent pointer-coarse:min-h-11"
                    >
                      <Checkbox checked={!f.excluded} onCheckedChange={(c) => r.setKept(f.key, c !== true)} />
                      <span className={cn("truncate font-mono text-xs", f.excluded && "text-subtle")}>{preview(f.value, 48)}</span>
                      <code className={cn("font-mono text-2xs whitespace-nowrap text-(--cat)", f.excluded && "text-subtle line-through")}>
                        {f.token}
                      </code>
                      {f.count > 1 ? (
                        <span className="text-2xs text-subtle tabular-nums" title={plural(f.count, "occurrence")}>
                          ×{f.count}
                        </span>
                      ) : null}
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="p-3 text-center text-sm text-subtle">Nothing detected yet.</p>
      )}
    </section>
  );
}

export function ReviewPanel({ r, className }: { r: Redactor; className?: string }) {
  return (
    <Panel
      aria-label="Review"
      className={cn("overflow-y-auto lg:max-xl:grid lg:max-xl:grid-cols-[1fr_1fr_1.2fr] lg:max-xl:overflow-hidden", className)}
    >
      <TermsSection r={r} />
      <DetectorsSection r={r} />
      <FindingsSection r={r} />
    </Panel>
  );
}
