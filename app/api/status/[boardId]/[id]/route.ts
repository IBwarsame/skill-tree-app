import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { NodeStatus } from "@/lib/skillTreeData";

const VALID_STATUSES: NodeStatus[] = ["completed", "in_progress", "locked"];

// PATCH /api/status/<board-id>/<node-id> - update one node's saved status
// and/or proof link, scoped to its board. Both fields are optional so the
// frontend can send just the one that changed (a hold-complete sends
// status, editing the link field sends proofLink).
export async function PATCH(
  request: Request,
  { params }: { params: { boardId: string; id: string } }
) {
  const { status, proofLink } = await request.json();

  if (status !== undefined) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    db.prepare("UPDATE node_status SET status = ? WHERE board_id = ? AND id = ?").run(
      status,
      params.boardId,
      params.id
    );
  }

  if (proofLink !== undefined) {
    db.prepare("UPDATE node_status SET proof_link = ? WHERE board_id = ? AND id = ?").run(
      proofLink,
      params.boardId,
      params.id
    );
  }

  return NextResponse.json({ ok: true });
}
