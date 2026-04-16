import { getDb } from "@/lib/db";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = getDb();
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

  if (!task) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const transactions = db
    .prepare(
      `SELECT
         t.id,
         t.task_id,
         t.buyer_agent_id,
         t.seller_agent_id,
         t.amount,
         t.negotiated_from,
         t.negotiated_to,
         t.status,
         t.locus_tx_id,
         t.tx_hash,
         t.task_description,
         t.result,
         t.created_at,
         t.completed_at,
         s.name as seller_name
       FROM transactions t
       LEFT JOIN agents s ON t.seller_agent_id = s.id
       WHERE t.task_id = ?
       ORDER BY t.created_at ASC`
    )
    .all(id);

  return Response.json({ ...task, transactions });
}
