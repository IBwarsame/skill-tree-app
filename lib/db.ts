import Database from "better-sqlite3";
import path from "path";
import { skillBoards } from "./skillTreeData";

// SQLite is just a file on disk - no server to run, which is why it's a
// good fit for a small single-user app like this.
let dbInstance: Database.Database | null = null;

// Opens (and seeds) the database the first time it's actually needed,
// instead of the moment this file is imported.
//
// Why this matters: Next.js imports route files in more places than just
// "handling a real request" - `next build` also imports them to inspect
// what they export. Both API routes import this file, so with the DB
// opened at import time, every one of those imports tried to open and
// seed the same skilltree.db at once. Locally that race resolved fast
// enough to go unnoticed; inside Docker it was slow enough that two
// imports collided on the same file lock and hung forever. Wrapping the
// setup in a function that only runs on first actual call means importing
// this module never touches the filesystem - only calling getDb() does.
export function getDb() {
  if (dbInstance) return dbInstance;

  const dbPath = path.join(process.cwd(), "skilltree.db");
  const db = new Database(dbPath);

  // Create the table on first run. IF NOT EXISTS means this is safe to run
  // every time the server starts - it's a no-op once the table already
  // exists. Status is scoped per board (board_id + id together identify a
  // row), since two different boards could otherwise use overlapping ids.
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

  dbInstance = db;
  return dbInstance;
}
