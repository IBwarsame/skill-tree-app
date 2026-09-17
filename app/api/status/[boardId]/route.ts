import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/status/<board-id> - return the saved status for every node on
// one board. The frontend calls this once per board when the tree first
// loads, to find out what's actually been saved (rather than trusting the
// hardcoded defaults in skillTreeData.ts, which are just the starting point).
export async function GET(
  request: Request,
  { params }: { params: { boardId: string } }
) {
  const rows = db
    .prepare("SELECT id, status, proof_link FROM node_status WHERE board_id = ?")
    .all(params.boardId);
  return NextResponse.json(rows);
}
