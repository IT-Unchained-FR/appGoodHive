import { SuperbotWidget } from "@/app/components/superbot/SuperbotWidget";

export const dynamic = "force-dynamic";

export default function SuperbotPage() {
  return (
    <main style={styles.page}>
      <section style={styles.hero}>
        <p style={styles.kicker}>GoodHive AI Helper</p>
        <h1 style={styles.title}>Superbot Widget Preview</h1>
        <p style={styles.subtitle}>
          This page shows the floating helper in its on-site form. Use the round ring
          button to open the chat window.
        </p>
      </section>
      <SuperbotWidget defaultOpen />
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    padding: "80px 24px",
    background:
      "radial-gradient(circle at top, rgba(255, 201, 5, 0.18), transparent 45%), linear-gradient(180deg, #fff7e1 0%, #ffffff 60%)",
  },
  hero: {
    maxWidth: 720,
    margin: "0 auto",
    textAlign: "center" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  kicker: {
    textTransform: "uppercase" as const,
    letterSpacing: "0.2em",
    fontSize: 12,
    color: "#b45309",
    margin: 0,
  },
  title: {
    margin: 0,
    fontSize: 38,
    fontWeight: 700,
    color: "#2d2a1f",
  },
  subtitle: {
    margin: 0,
    fontSize: 16,
    color: "#7a5c22",
  },
};
