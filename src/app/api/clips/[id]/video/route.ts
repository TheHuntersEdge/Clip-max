import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** MVP: stream a clip's mp4 bytes straight from Postgres. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const clip = await prisma.clip.findUnique({
    where: { id },
    select: { data: true, title: true },
  });
  if (!clip?.data) {
    return new Response("Clip not found", { status: 404 });
  }
  const bytes = clip.data;
  return new Response(bytes as unknown as BodyInit, {
    headers: {
      "Content-Type": "video/mp4",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Disposition": `inline; filename="clip-${id}.mp4"`,
    },
  });
}
