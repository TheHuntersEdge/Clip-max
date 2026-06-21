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

(async () => {
  const posts = await prisma.post.groupBy({ by: ["status"], _count: true });
  console.log("posts by status:", posts.map((s) => `${s.status}:${s._count}`).join("  "));
  const clips = await prisma.clip.groupBy({ by: ["status"], _count: true });
  console.log("clips by status:", clips.map((s) => `${s.status}:${s._count}`).join("  "));
  const posted = await prisma.post.findMany({
    where: { status: "POSTED" },
    take: 5,
    orderBy: { postedAt: "desc" },
    include: { account: { select: { platform: true, handle: true } } },
  });
  for (const p of posted) {
    const m = p.metrics as { views?: number; url?: string } | null;
    console.log(`  posted → ${p.account.platform} ${p.account.handle} | ${m?.views} views | ${m?.url}`);
  }
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
