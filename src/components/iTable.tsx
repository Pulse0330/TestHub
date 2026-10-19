"use client";

import {
	type ColumnDef,
	flexRender,
	getCoreRowModel,
	getExpandedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ChevronRight } from "lucide-react";
import * as React from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	className?: string;
	expandKey?: string; // Энд string байхаар авбал илүү уян хатан
}

export function ITable<TData extends Record<string, unknown>, TValue>({
	columns,
	data,
	className,
	expandKey = "items",
}: DataTableProps<TData, TValue>) {
	const [expanded, setExpanded] = React.useState({});

	const table = useReactTable({
		data,
		columns,
		state: { expanded },
		onExpandedChange: setExpanded,
		getSubRows: (row) => row[expandKey] as TData[] | undefined,
		getCoreRowModel: getCoreRowModel(),
		getExpandedRowModel: getExpandedRowModel(),
	});

	return (
		<div
			className={cn(
				"card-pop w-full overflow-hidden",
				className,
			)}
		>
			<Table>
				<TableHeader className="bg-muted">
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id} className="border-b-2 hover:bg-transparent">
							<TableHead className="w-10" />
							{headerGroup.headers.map((header) => (
								<TableHead key={header.id} className="py-3.5 text-xs font-extrabold tracking-wide text-muted-foreground uppercase">
									{flexRender(
										header.column.columnDef.header,
										header.getContext(),
									)}
								</TableHead>
							))}
						</TableRow>
					))}
				</TableHeader>
				<TableBody>
					{table.getRowModel().rows?.length ? (
						table.getRowModel().rows.map((row) => {
							const isSubRow = row.depth > 0;

							// Эцэг доторх хамгийн сүүлийн мөр эсэхийг тодорхойлох (Алдаагүй хувилбар)
							const parent = row.getParentRow();
							const siblings = parent
								? (parent.original[expandKey] as TData[])
								: (table.options.data as TData[]);
							const isLastChild = row.index === siblings.length - 1;

							return (
								<TableRow
									key={row.id}
									className={cn(
										"transition-colors border-b last:border-0",
										isSubRow
											? "bg-muted/30 text-sm hover:bg-accent/50"
											: "text-[15px] font-semibold hover:bg-accent/50",
									)}
								>
									<TableCell className="w-10 relative p-0 px-2">
										{isSubRow && (
											<>
												{/* Босоо зураас - Сүүлийнх бол таллана */}
												<div
													className={cn(
														"absolute top-0 left-6 w-0.5 bg-border",
														isLastChild ? "h-1/2" : "h-full",
													)}
												/>
												{/* Хөндлөн зураас - Булан гаргах */}
												<div className="absolute top-1/2 left-6 h-0.5 w-3 bg-border" />
											</>
										)}

										<div className="relative z-10 flex justify-center">
											{row.getCanExpand() && (
												<button
													onClick={row.getToggleExpandedHandler()}
													className="flex size-6 items-center justify-center rounded-lg border-2 border-border bg-card shadow-[0_2px_0_0_var(--border)] transition-all hover:bg-muted active:translate-y-0.5 active:shadow-none"
													type="button"
												>
													<ChevronRight
														size={12}
														strokeWidth={3}
														className={cn(
															"transition-transform duration-200",
															row.getIsExpanded() && "rotate-90 text-primary",
														)}
													/>
												</button>
											)}
										</div>
									</TableCell>

									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className="py-3.5"
											style={{
												paddingLeft:
													cell.column.id === columns[0].id
														? `${row.depth * 0.5}rem`
														: undefined,
											}}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							);
						})
					) : (
						<TableRow>
							<TableCell
								colSpan={columns.length + 1}
								className="h-32 text-center font-semibold text-muted-foreground"
							>
								Өгөгдөл олдсонгүй.
							</TableCell>
						</TableRow>
					)}
				</TableBody>
			</Table>
		</div>
	);
}
