import bcrypt from "bcryptjs";
import postgres from "postgres";
import { invoices, customers, revenue, users } from "../lib/placeholder-data";
import { getDatabaseError } from "../lib/database-error";

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: "require",
  prepare: false,
});

export async function GET() {
  try {
    await sql.begin(async (tx) => {
      await tx`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;
      await tx`
        CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL
        );
      `;
      await tx`
        CREATE TABLE IF NOT EXISTS customers (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          image_url VARCHAR(255) NOT NULL
        );
      `;
      await tx`
        CREATE TABLE IF NOT EXISTS invoices (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          customer_id UUID NOT NULL,
          amount INT NOT NULL,
          status VARCHAR(255) NOT NULL,
          date DATE NOT NULL
        );
      `;
      await tx`
        CREATE TABLE IF NOT EXISTS revenue (
          month VARCHAR(4) NOT NULL UNIQUE,
          revenue INT NOT NULL
        );
      `;

      for (const user of users) {
        const password = await bcrypt.hash(user.password, 10);
        await tx`
          INSERT INTO users (id, name, email, password)
          VALUES (${user.id}, ${user.name}, ${user.email}, ${password})
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      for (const customer of customers) {
        await tx`
          INSERT INTO customers (id, name, email, image_url)
          VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
          ON CONFLICT (id) DO NOTHING;
        `;
      }

      for (const invoice of invoices) {
        await tx`
          INSERT INTO invoices (customer_id, amount, status, date)
          SELECT ${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date}
          WHERE NOT EXISTS (
            SELECT 1 FROM invoices
            WHERE customer_id = ${invoice.customer_id}
              AND amount = ${invoice.amount}
              AND status = ${invoice.status}
              AND date = ${invoice.date}
          );
        `;
      }

      for (const rev of revenue) {
        await tx`
          INSERT INTO revenue (month, revenue)
          VALUES (${rev.month}, ${rev.revenue})
          ON CONFLICT (month) DO NOTHING;
        `;
      }
    });

    return Response.json({ message: "Database seeded successfully" });
  } catch (error) {
    return Response.json(getDatabaseError(error), { status: 500 });
  }
}
