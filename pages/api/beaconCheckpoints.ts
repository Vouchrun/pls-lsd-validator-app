import { fetchWithBeaconFallback } from "utils/beaconUtils";
import type { NextApiRequest, NextApiResponse } from "next";

type ResponseData = {
  message: string;
};

/**
 * 
 *  0:  "PENDING_INITIALIZED",
    1:  "PENDING_QUEUED",

    2:  "ACTIVE_ONGOING",
    3:  "ACTIVE_EXITING",
    4:  "ACTIVE_SLASHED",

    5:  "EXITED_UNSLASHED",
    6:  "EXITED_SLASHED",

    7:  "WITHDRAWAL_POSSIBLE",
    8:  "WITHDRAWAL_DONE",

    9:  "ACTIVE",
    10: "PENDING",
    11: "EXITED",
    12: "WITHDRAWAL",

    四大类: pending 0 1  10,  active  2 3 4 9,  exited  5 6 11,  withdrawal 7 8 12
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const resJson = await fetchWithBeaconFallback(
    `/eth/v1/beacon/states/head/finality_checkpoints`,
    {
      method: "GET",
    }
  );

  res.status(200).json(resJson);
}
