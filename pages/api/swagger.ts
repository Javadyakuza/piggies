import { getApiDocs } from "@/lib/swagger";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const spec = await getApiDocs();
    res.status(200).json(spec);
  } catch (error) {
    console.error("Error generating Swagger spec:", error);
    res.status(500).json({ error: "Failed to generate Swagger spec" });
  }
}