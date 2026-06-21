/* One-off: fire a render job at production and watch the DB until it finishes. */
import { readFileSync } from "node:fs";

for (const line of readFileSync(".env", "utf8").split("\n")) {
  const m = line.match(/^(\w+)="([^"]*)"$/);
  if (m) process.env[m[1]] = m[2];
}

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const VOD = process.argv[2] ?? "https://www.youtube.com/watch?v=jNQXAC9IVRw";
const TITLE = process.argv[3] ?? "First test clip";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const res = await fetch("https://clipmax-pied.vercel.app/api/jobs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ vodUrl: VOD, title: TITLE }),
  });
  const job = await res.json();
  if (!res.ok) throw new Error(`job create failed: ${res.status} ${JSON.stringify(job)}`);
  const streamId: string = job.streamId;
  console.log(`job created → stream ${streamId} (status ${job.status})`);
  console.log("watching for the worker to pick it up…\n");

  let last = "";
  for (let i = 0; i < 30; i++) {
    const stream = await prisma.stream.findUnique({ where: { id: streamId } });
    const clips = await prisma.clip.count({ where: { streamId } });
    const line = `${stream?.status} · clips: ${clips}`;
    if (line !== last) {
      console.log(`[${i * 12}s] ${line}`);
      last = line;
    }
    if (stream?.status === "DONE" || stream?.status === "FAILED") {
      const all = await prisma.clip.findMany({
        where: { streamId },
        orderBy: { score: "desc" },
      });
      console.log(`\n=== ${stream.status} — ${all.length} clips ===`);
      if (stream.status === "FAILED" && stream.error) {
        console.log("WORKER ERROR:\n" + stream.error + "\n");
      }
      for (const c of all) {
        console.log(`[${c.score}] ${c.title} | ${c.caption}`);
        console.log(`   ${c.start}s–${c.end}s  ${c.renderUrl}`);
      }
      await prisma.$disconnect();
      return;
    }
    await sleep(12_000);
  }
  console.log("\ntimed out waiting (6 min). Stream still:", last);
  console.log("If it never left PROCESSING, the worker isn't picking it up — check Railway logs.");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("ERR", e.message);
  await prisma.$disconnect();
  process.exit(1);
});
