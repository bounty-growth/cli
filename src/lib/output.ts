export type OutputOptions = {
  json?: boolean;
};

export function writeJson(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

export function writeLine(value = "") {
  console.log(value);
}

export function writeKeyValues(
  values: Record<string, string | number | boolean | null>
) {
  const width = Math.max(...Object.keys(values).map((key) => key.length));

  for (const [key, value] of Object.entries(values)) {
    writeLine(`${key.padEnd(width)}  ${value ?? "-"}`);
  }
}

export function formatNumber(
  value: number | null | undefined,
  options: Intl.NumberFormatOptions = {}
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    ...options,
  }).format(value);
}

export function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(
  value: number | null | undefined,
  options: { valueIsRatio?: boolean } = {}
) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  const valueIsRatio = options.valueIsRatio ?? true;
  const percentValue = valueIsRatio ? value * 100 : value;

  return `${formatNumber(percentValue)}%`;
}

export function writeOutput(
  value: unknown,
  options: OutputOptions,
  renderHuman: () => void
) {
  if (options.json) {
    writeJson(value);
    return;
  }

  renderHuman();
}

export type TableColumn<T> = {
  header: string;
  value: (row: T) => string | number | boolean | null | undefined;
};

export function writeTable<T>(rows: T[], columns: TableColumn<T>[]) {
  if (rows.length === 0) {
    writeLine("No results");
    return;
  }

  const renderedRows = rows.map((row) =>
    columns.map((column) => String(column.value(row) ?? "-"))
  );
  const widths = columns.map((column, index) =>
    Math.max(
      column.header.length,
      ...renderedRows.map((row) => row[index]?.length ?? 0)
    )
  );

  writeLine(
    columns
      .map((column, index) => column.header.padEnd(widths[index]))
      .join("  ")
  );
  writeLine(widths.map((width) => "-".repeat(width)).join("  "));

  for (const row of renderedRows) {
    writeLine(row.map((cell, index) => cell.padEnd(widths[index])).join("  "));
  }
}
