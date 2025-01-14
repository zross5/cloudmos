import { useQuery } from "react-query";
import { QueryKeys } from "./queryKeys";
import axios from "axios";
import { useSettings } from "../context/SettingsProvider";
import { ApiUrlService } from "@src/utils/apiUtils";
import { BidDto, RpcBid } from "@src/types/deployment";

async function getBidList(apiEndpoint: string, address: string, dseq: string): Promise<Array<BidDto>> {
  if (!address || !dseq) return null;

  const response = await axios.get(ApiUrlService.bidList(apiEndpoint, address, dseq));

  return response.data.bids.map((b: RpcBid) => ({
    id: b.bid.bid_id.provider + b.bid.bid_id.dseq + b.bid.bid_id.gseq + b.bid.bid_id.oseq,
    owner: b.bid.bid_id.owner,
    provider: b.bid.bid_id.provider,
    dseq: b.bid.bid_id.dseq,
    gseq: b.bid.bid_id.gseq,
    oseq: b.bid.bid_id.oseq,
    price: b.bid.price,
    state: b.bid.state
  }));
}

export function useBidList(address: string, dseq: string, options) {
  const { settings } = useSettings();
  return useQuery(QueryKeys.getBidListKey(address, dseq), () => getBidList(settings.apiEndpoint, address, dseq), options);
}
