import Database from "better-sqlite3";
import path from "path";
import { skillBoards } from "./skillTreeData";

// One shared connection to a SQLite file that lives in the project root.
// SQLite is just a file on disk - no server to run, which is why it's a
// good fit for a small single-user app like this.
const dbPath = path.join(process.cwd(), "skilltree.db");
export const db = new Database(dbPath);

// Create the table on first run. IF NOT EXISTS means this is safe to run
// every time the server starts - it's a no-op once the table already exists.
// Status is now scoped per board (board_id + id together identify a row),
// since two different boards could otherwise use overlapping node ids.
db.exec(`
  CREATE TABLE IF NOT EXISTS node_status (
    board_id TEXT NOT NULL,
    id TEXT NOT NULL,
    status TEXT NOT NULL,
    proof_link TEXT,
    PRIMARY KEY (board_id, id)
  )
`);

// Seed the table with each node's starting status from skillTreeData.ts,
// but only the first time - INSERT OR IGNORE skips rows whose id already
// exists, so re-running this on every server start won't overwrite
// progress you've already saved.
const seedStatus = db.prepare(
  "INSERT OR IGNORE INTO node_status (board_id, id, status, proof_link) VALUES (?, ?, ?, ?)"
);
const seedAll = db.transaction(() => {
  for (const board of skillBoards) {
    for (const node of board.nodes) {
      seedStatus.run(board.id, node.id, node.status, node.proofLink ?? "");
    }
  }
});
seedAll();
