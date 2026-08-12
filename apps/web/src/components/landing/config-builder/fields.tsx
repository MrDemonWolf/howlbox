// Shared field primitives for the configurator: the fieldset wrapper,
// the label/control/hint row, and the number and toggle inputs. Every
// row in the form is built from these so spacing and hint placement stay
// uniform.

import { Checkbox } from "@howlbox/ui/components/checkbox";
import { Input } from "@howlbox/ui/components/input";
import { Label } from "@howlbox/ui/components/label";
import React, { useId, useState } from "react";

import { clampNumber, FIELD } from "./form-model";

export function Fieldset({
	title,
	hint,
	hintId,
	children,
}: {
	title: string;
	hint?: string;
	// set when a control inside points at this hint with aria-describedby
	hintId?: string;
	children: React.ReactNode;
}) {
	return (
		<section className="hb-card flex flex-col gap-4 p-5">
			{/* h2: the page h1 is "Configure your overlay"; skipping to h3
			    breaks the outline for screen readers. Sized like a heading
			    rather than like a mono micro-label: at 0.7rem uppercase it
			    rendered smaller than the h3s further down the page. */}
			<div className="flex flex-col gap-1.5">
				<h2 className="font-semibold text-[color:var(--site-txt-1)] text-base">
					{title}
				</h2>
				{hint && (
					<p
						className="text-[color:var(--site-txt-2)] text-sm leading-relaxed"
						id={hintId}
					>
						{hint}
					</p>
				)}
			</div>
			{children}
		</section>
	);
}

// One label/control/hint stack, so every row in the form has the same
// spacing and every hint sits in the same place.
export function Field({
	label,
	htmlFor,
	hint,
	children,
}: {
	label: string;
	htmlFor?: string;
	hint?: React.ReactNode;
	children: React.ReactNode;
}) {
	const generatedId = useId();

	if (!htmlFor) {
		const groupHintId = hint ? `${generatedId}-hint` : undefined;
		return (
			<fieldset aria-describedby={groupHintId} className="grid gap-2">
				<legend className="mb-2 font-medium text-sm">{label}</legend>
				{children}
				{hint && (
					<p
						className="text-[color:var(--site-txt-2)] text-xs leading-relaxed"
						id={groupHintId}
					>
						{hint}
					</p>
				)}
			</fieldset>
		);
	}

	const hintId = hint ? `${htmlFor}-hint` : undefined;
	return (
		<div className="grid gap-2">
			<Label htmlFor={htmlFor}>{label}</Label>
			{hintId ? describe(children, hintId) : children}
			{hint && (
				<p
					className="text-[color:var(--site-txt-2)] text-xs leading-relaxed"
					id={hintId}
				>
					{hint}
				</p>
			)}
		</div>
	);
}

// Field renders whatever control it is handed, so the only place to wire
// aria-describedby without threading a prop through every call site is
// the element itself.
function describe(children: React.ReactNode, hintId: string) {
	return React.Children.map(children, (child) =>
		React.isValidElement(child)
			? React.cloneElement(
					child as React.ReactElement<{ "aria-describedby"?: string }>,
					{
						"aria-describedby": hintId,
					},
				)
			: child,
	);
}

// Number input that tolerates a cleared field while typing: the draft
// holds the raw text during editing (so backspace doesn't snap to the
// fallback), commits clamped values as they land, and re-syncs the
// display to the committed value on blur.
export function NumberField({
	id,
	label,
	min,
	max,
	fallback,
	value,
	onCommit,
	hint,
}: {
	id: string;
	label: string;
	min: number;
	max: number;
	fallback: number;
	value: number;
	onCommit: (value: number) => void;
	hint?: string;
}) {
	const [draft, setDraft] = useState<string | null>(null);

	return (
		<Field hint={hint} htmlFor={id} label={label}>
			<Input
				className={FIELD}
				id={id}
				max={max}
				min={min}
				onBlur={() => setDraft(null)}
				onChange={(e) => {
					setDraft(e.target.value);
					if (e.target.value !== "") {
						onCommit(clampNumber(e.target.value, min, max, fallback));
					}
				}}
				type="number"
				value={draft ?? String(value)}
			/>
		</Field>
	);
}

export function Toggle({
	id,
	label,
	checked,
	hint,
	onChange,
}: {
	id: string;
	label: string;
	checked: boolean;
	hint?: React.ReactNode;
	onChange: (value: boolean) => void;
}) {
	return (
		<div className="grid gap-1">
			<div className="flex items-center gap-2.5">
				<Checkbox
					aria-describedby={hint ? `${id}-hint` : undefined}
					checked={checked}
					className="size-5 rounded-[0.3rem]"
					id={id}
					onCheckedChange={(value) => onChange(value === true)}
				/>
				{/* label fills the row so the tap/click target is 44px tall,
				    not just the 20px box */}
				<Label
					className="flex min-h-11 flex-1 items-center font-normal text-sm"
					htmlFor={id}
				>
					{label}
				</Label>
			</div>
			{hint && (
				<p
					className="pl-[1.875rem] text-[color:var(--site-txt-2)] text-xs leading-relaxed"
					id={`${id}-hint`}
				>
					{hint}
				</p>
			)}
		</div>
	);
}
