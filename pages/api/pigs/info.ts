import type { NextApiRequest, NextApiResponse } from "next";
import { PigInfosResponse } from "@/models/purchase";
import { getPigsInfos } from "@/utils/purchase/dbOps";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PigInfosResponse>
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  try {
    const response = {
      success: true,
      pigs: await getPigsInfos(),
    } as const;

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error handling pig purchase:", error);
    return res.status(500).json({
      success: false,
      message: `Failed to update pig value, message ${error}`,
    });
  }
}
