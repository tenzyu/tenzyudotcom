import type * as React from "react";

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  boxSizing: "border-box",
  background:
    "radial-gradient(circle at top left, color-mix(in oklch, var(--primary) 13%, transparent), transparent 34rem), var(--background)",
  color: "var(--foreground)",
  padding: "32px",
};

const contentStyle: React.CSSProperties = {
  width: "min(1120px, 100%)",
  margin: "0 auto",
  display: "grid",
  gap: "28px",
};

export function StorybookPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main style={pageStyle}>
      <div style={contentStyle}>
        <header style={{ display: "grid", gap: 8 }}>
          <p
            style={{
              margin: 0,
              color: "var(--muted-foreground)",
              fontSize: 12,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            @tenzyu/ui design system
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(28px, 4vw, 48px)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            {title}
          </h1>
          {description ? (
            <p
              style={{
                margin: 0,
                maxWidth: 760,
                color: "var(--muted-foreground)",
                fontSize: 16,
                lineHeight: 1.65,
              }}
            >
              {description}
            </p>
          ) : null}
        </header>
        {children}
      </div>
    </main>
  );
}

export function StorybookSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        display: "grid",
        gap: 16,
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        background: "color-mix(in oklch, var(--card) 88%, transparent)",
        boxShadow: "var(--shadow-surface)",
        padding: 24,
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.25 }}>{title}</h2>
        {description ? (
          <p style={{ margin: 0, color: "var(--muted-foreground)", lineHeight: 1.6 }}>
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function StorybookGrid({
  min = 220,
  children,
}: {
  min?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(auto-fit, minmax(min(${min}px, 100%), 1fr))`,
        gap: 16,
      }}
    >
      {children}
    </div>
  );
}

export function StorybookRow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 12,
      }}
    >
      {children}
    </div>
  );
}

export function StorybookTile({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        alignContent: "start",
        gap: 12,
        minHeight: 108,
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        background: "color-mix(in oklch, var(--background) 60%, var(--card))",
        padding: 16,
      }}
    >
      <div style={{ color: "var(--muted-foreground)", fontSize: 12, fontWeight: 700 }}>
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function StorybookSwatch({ name, value }: { name: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "48px 1fr",
        gap: 12,
        alignItems: "center",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-md)",
        padding: 10,
        background: "var(--card)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "block",
          width: 48,
          height: 36,
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--border)",
          background: value,
        }}
      />
      <span style={{ display: "grid", gap: 2 }}>
        <strong>{name}</strong>
        <code style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{value}</code>
      </span>
    </div>
  );
}

export function StorybookNote({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid color-mix(in oklch, var(--info) 45%, var(--border))",
        background: "color-mix(in oklch, var(--info) 9%, transparent)",
        borderRadius: "var(--radius-lg)",
        padding: 16,
        color: "var(--foreground)",
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  );
}
