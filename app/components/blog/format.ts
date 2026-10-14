const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export const formatBlogDate = (iso: string | null) => (iso ? DATE_FORMAT.format(new Date(iso)) : null);
