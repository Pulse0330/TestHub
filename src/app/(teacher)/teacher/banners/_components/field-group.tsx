import type * as React from "react";

/** Олон контролтой талбар — `<label>` биш (Field нь label тул товч дээр дарахад буруу контрол идэвхждэг). */
export function FieldGroup({
	label,
	required,
	children,
}: {
	label: string;
	required?: boolean;
	children: React.ReactNode;
}) {
	return (
		<fieldset className="grid min-w-0 gap-1.5">
			<legend className="mb-1.5 text-sm font-bold text-foreground">
				{label}
				{required && <span className="ml-0.5 text-destructive">*</span>}
			</legend>
			{children}
		</fieldset>
	);
}
