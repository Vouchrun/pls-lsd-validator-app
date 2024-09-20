import { getNodeDepositContract } from 'config/contract';
import { getNodeDepositContractAbi } from 'config/contractAbi';
import { ChainPubkeyStatus, NodePubkeyInfo } from 'interfaces/common';
import { useCallback, useEffect, useState } from 'react';
import { fetchPubkeyStatus } from 'utils/apiUtils';
import { createWeb3, getEthWeb3 } from 'utils/web3Utils';
import { useWalletAccount } from './useWalletAccount';

export function usePoolPubkeyData() {
  const [matchedValidators, setMatchedValidators] = useState<string>();
  const [nodes, setNodes] = useState<string[]>([]);
  const [trustNodePubkeyNumberLimit, setTrustNodePubkeyNumberLimit] =
    useState<string>();

  const web3 = getEthWeb3();

  const nodeDepositContract = new web3.eth.Contract(
    getNodeDepositContractAbi(),
    getNodeDepositContract(),
    {}
  );
  let isSettingNodes = false;

  async function setNodesWithCheck(nodesValue: any) {
    if (isSettingNodes) return;

    isSettingNodes = true;
    setNodes([]);
    const uniqueNodes = new Set<string>();

    for (let i = 0; i < nodesValue.length; i++) {
      const isTrusted = await nodeDepositContract.methods
        .nodeInfoOf(nodesValue[i])
        .call()
        .catch((err: any) => {
          console.log({ err });
        });

      if (isTrusted[0] == 2 && !uniqueNodes.has(nodesValue[i])) {
        uniqueNodes.add(nodesValue[i]);
        setNodes((prev) => [...prev, nodesValue[i]]);
      }
    }

    isSettingNodes = false;
  }

  const updateMatchedValidators = useCallback(async () => {
    try {
      const nodesLength = await nodeDepositContract.methods
        .getNodesLength()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });

      const nodesValue = await nodeDepositContract.methods
        .getNodes(0, nodesLength)
        .call()
        .catch((err: any) => {
          console.log({ err });
        });

      // setNodes([]);
      // const uniqueNodes = new Set<string>();

      // for (let i = 0; i < nodesValue.length; i++) {
      //   const isTrusted = await nodeDepositContract.methods
      //     .nodeInfoOf(nodesValue[i])
      //     .call()
      //     .catch((err: any) => {
      //       console.log({ err });
      //     });
      //   if (isTrusted[0] == 2 && !uniqueNodes.has(nodesValue[i])) {
      //     uniqueNodes.add(nodesValue[i]);
      //     setNodes((prev) => [...prev, nodesValue[i]]);
      //   }
      // }

      setNodesWithCheck(nodesValue);

      const trustNodePubkeyNumberLimitValue = await nodeDepositContract.methods
        .trustNodePubkeyNumberLimit()
        .call()
        .catch((err: any) => {
          console.log({ err });
        });

      setTrustNodePubkeyNumberLimit(trustNodePubkeyNumberLimitValue);

      const pubkeyAddressList: string[] = [];

      // Query node pubkey addresses
      const requests = nodesValue?.map((nodeAddress: string) => {
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

  // const addTrustNode = async (value: string) => {
  //   try {
  //     await nodeDepositContract.methods
  //       .addTrustNode(value)
  //       .send({ from: metaMaskAccount })
  //       .catch((err: any) => {
  //         console.log({ err });
  //       });
  //     return true;
  //   } catch (err: any) {
  //     console.log({ err });
  //     return false;
  //   }
  // };

  // const removeTrustNode = async (value: string) => {
  //   try {
  //     await nodeDepositContract.methods
  //       .removeTrustNode(value)
  //       .send({ from: metaMaskAccount })
  //       .catch((err: any) => {
  //         console.log({ err });
  //       });
  //     return true;
  //   } catch (err: any) {
  //     console.log({ err });
  //     return false;
  //   }
  // };

  useEffect(() => {
    updateMatchedValidators();
  }, [updateMatchedValidators]);

  return {
    matchedValidators,
    trustNodePubkeyNumberLimit,
    nodes,
    // addTrustNode,
    // removeTrustNode,
  };
}
