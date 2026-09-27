type DatabaseError = {
  code?: string;
  message?: string;
};

export function getDatabaseError(error: unknown) {
  const databaseError = error as DatabaseError;
  const code = databaseError.code ?? "DATABASE_ERROR";
  const message =
    code === "ETIMEDOUT"
      ? "Could not reach PostgreSQL. Check that the database is running and allows connections from this network."
      : code === "42P01"
        ? "A table or view is missing from the connected database schema. Run the seed route, then retry the query."
        : databaseError.message?.trim() || "The database request failed.";

  return { error: { code, message } };
}
