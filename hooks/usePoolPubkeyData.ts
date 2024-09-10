import { getNodeDepositContract } from 'config/contract';
import { getNodeDepositContractAbi } from 'config/contractAbi';
import { ChainPubkeyStatus, NodePubkeyInfo } from 'interfaces/common';
import { useCallback, useEffect, useState } from 'react';
import { fetchPubkeyStatus } from 'utils/apiUtils';
import { getEthWeb3 } from 'utils/web3Utils';

export function usePoolPubkeyData() {
  const [matchedValidators, setMatchedValidators] = useState<string>();
  const [trustNodePubkeyNumberLimit, setTrustNodePubkeyNumberLimit] =
    useState<string>();

  const updateMatchedValidators = useCallback(async () => {
    try {
      const web3 = getEthWeb3();

      const nodeDepositContract = new web3.eth.Contract(
        getNodeDepositContractAbi(),
        getNodeDepositContract(),
        {}
      );

      const nodesLength = await nodeDepositContract.methods
        .getNodesLength()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });

      const nodes = await nodeDepositContract.methods
        .getNodes(0, nodesLength)
        .call()
        .catch((err: any) => {
          console.log({ err });
        });

      const trustNodePubkeyNumberLimitValue = await nodeDepositContract.methods
        .trustNodePubkeyNumberLimit()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });

      setTrustNodePubkeyNumberLimit(trustNodePubkeyNumberLimitValue);

      const pubkeyAddressList: string[] = [];

      // Query node pubkey addresses
      const requests = nodes?.map((nodeAddress: string) => {
        return (async () => {
          const pubkeys: string[] = await nodeDepositContract.methods
            .getPubkeysOfNode(nodeAddress)
            .call()
            .catch((err: any) => {
              console.log({ err });
            });
          pubkeyAddressList.push(...pubkeys);
        })();
      });
      await Promise.all(requests);

      // Query beacon pubkey status list
      // const beaconStatusResponse = await fetch(
      //   `/api/pubkeyStatus?id=${pubkeyAddressList.join(",")}`,
      //   {
      //     method: "GET",
      //   }
      // );
      // const beaconStatusResJson = await beaconStatusResponse.json();
      const beaconStatusResJson = await fetchPubkeyStatus(
        pubkeyAddressList.join(',')
      );

      // Query on-chain pubkey detail info list
      const pubkeyInfoRequests = pubkeyAddressList?.map(
        (pubkeyAddress: string) => {
          return (async () => {
            const pubkeyInfo = await nodeDepositContract.methods
              .pubkeyInfoOf(pubkeyAddress)
              .call()
              .catch((err: any) => {
                console.log({ err });
              });

            return pubkeyInfo;
          })();
        }
      );
      const pubkeyInfos = await Promise.all(pubkeyInfoRequests);

      const nodePubkeyInfos: NodePubkeyInfo[] = pubkeyInfos.map(
        (item, index) => {
          const matchedBeaconData = beaconStatusResJson.data?.find(
            (item: any) => item.validator?.pubkey === pubkeyAddressList[index]
          );
          return {
            pubkeyAddress: pubkeyAddressList[index],
            beaconApiStatus:
              matchedBeaconData?.status?.toUpperCase() || undefined,
            ...item,
          };
        }
      );

      let matchedValidators = 0;

      nodePubkeyInfos.forEach((item) => {
        if (
          item._status === ChainPubkeyStatus.Staked &&
          item.beaconApiStatus !== 'EXITED_UNSLASHED' &&
          item.beaconApiStatus !== 'EXITED_SLASHED' &&
          item.beaconApiStatus !== 'EXITED'
        ) {
          matchedValidators += 1;
        }

        if (
          item._status === ChainPubkeyStatus.Staked &&
          (item.beaconApiStatus === 'EXITED_UNSLASHED' ||
            item.beaconApiStatus === 'EXITED_SLASHED' ||
            item.beaconApiStatus === 'EXITED')
        ) {
          matchedValidators += 1;
        }
      });

      setMatchedValidators(matchedValidators + '');
    } catch (err: any) {
      console.log({ err });
    }
  }, []);

  useEffect(() => {
    updateMatchedValidators();
  }, [updateMatchedValidators]);

  return {
    matchedValidators,
    trustNodePubkeyNumberLimit,
  };
}
