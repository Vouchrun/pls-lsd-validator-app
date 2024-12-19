import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import classNames from 'classnames';
import { EmptyContent } from 'components/common/EmptyContent';
import { Icomoon } from 'components/icon/Icomoon';
import {
  getNetworkWithdrawContract,
  getNodeDepositContract,
} from 'config/contract';
import {
  getNetworkWithdrawContractAbi,
  getNodeDepositContractAbi,
} from 'config/contractAbi';
import {
  getBeaconHost,
  getValidatorInfoURL,
  getWithdrawContractDeploymentBlock,
} from 'config/env';
import { robotoBold, robotoSemiBold } from 'config/font';
import { useAppSlice } from 'hooks/selector';
import * as moment from 'moment';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { openLink } from 'utils/commonUtils';
import { getDocLinks } from 'utils/configUtils';
import { getShortAddress } from 'utils/stringUtils';
import { getEthWeb3 } from 'utils/web3Utils';

const filterOptions = [
  {
    label: 'All Type',
    value: 'all',
  },
  { label: 'Exited', value: 'Exited' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Delayed', value: 'Delayed' },
];

const findStatus = (status: string) => {
  if (status === 'withdrawal_done') {
    return 'Exited';
  } else if (status === 'active_exiting') {
    return 'Pending';
  } else if (status === 'active_ongoing') {
    return 'Delayed';
  } else {
    return 'Unknown';
  }
};

const findStatusSymbol = (status: string) => {
  if (status === 'withdrawal_done') {
    return '🟢';
  } else if (status === 'active_exiting') {
    return '🟡';
  } else if (status === 'active_ongoing') {
    return '🔴';
  } else {
    return 'Unknown';
  }
};
export const ValidatorEjection = () => {
  const { darkMode } = useAppSlice();
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [validatorElectionData, setValidatorElectionData] = useState<any>([]);

  const web3 = getEthWeb3();
  const networkWithdrawContract = new web3.eth.Contract(
    getNetworkWithdrawContractAbi(),
    getNetworkWithdrawContract(),
    {}
  );

  const networkDepositContract = new web3.eth.Contract(
    getNodeDepositContractAbi(),
    getNodeDepositContract(),
    {}
  );

  const getData = async () => {
    const data: any = [];
    const currentBlock = await web3.eth.getBlockNumber();
    const events = await networkWithdrawContract.getPastEvents(
      'NotifyValidatorExit',
      {
        fromBlock: getWithdrawContractDeploymentBlock(),
        toBlock: currentBlock,
      }
    );
    events.forEach(async (event: any) => {
      const block = await web3.eth.getBlock(event.blockNumber);
      const timeStamp = block.timestamp;

      const response = await fetch(
        `${getBeaconHost()}/eth/v1/beacon/states/head/validators?id=` +
          event?.returnValues?.ejectedValidators[0],
        {
          method: 'GET',
          headers: {},
        }
      );

      const res = await response.json();

      const status = findStatus(res?.data[0]?.status);
      const statusSymbol = findStatusSymbol(res?.data[0]?.status);
      const poolAddress = res?.data[0]?.validator?.pubkey;

      const pubkeyInfoOf = await networkDepositContract.methods
        .pubkeyInfoOf(poolAddress)
        .call()
        .catch((err: any) => {
          console.log({ err });
        });
      const nodeAddress = pubkeyInfoOf._owner;

      data.push({
        timeStamp: +timeStamp * 1000,
        poolAddress: poolAddress,
        nodeAddress: nodeAddress,
        status: status,
        statusSymbol: statusSymbol,
      });
      setValidatorElectionData(data);
    });
  };
  useEffect(() => {
    setValidatorElectionData([]);
    getData();
  }, []);
  return (
    <div>
      <div className='mt-[.48rem] flex items-center justify-between'>
        <div className='flex items-center'>
          <div
            className={classNames(
              robotoBold.className,
              'text-[.24rem] text-color-text1'
            )}
          >
            Validator Election
          </div>

          <div
            className={classNames(
              'ml-[.16rem] items-center cursor-pointer',
              getDocLinks().ejectionMechanism ? 'flex' : 'hidden'
            )}
            onClick={() => {
              openLink(getDocLinks().ejectionMechanism);
            }}
          >
            <div className='text-color-text2 text-[.16rem]'>
              Ejection Mechanism
            </div>

            <div className='ml-[.06rem] flex items-center'>
              <Icomoon
                icon='right'
                size='.1rem'
                color={darkMode ? '#ffffff80' : '#6C86AD'}
              />
            </div>
          </div>
        </div>
        <div>
          <select
            value={selectedFilter}
            onChange={(e) => {
              setSelectedFilter(e.target.value);
            }}
            className='bg-transparent border-[1px] border-color-border1 rounded-[.3rem] px-[.24rem] py-[.1rem] text-[.16rem] text-color-text2 w-[1.5rem] outline-none'
          >
            {filterOptions.map((filter) => (
              <option value={filter.value}>{filter.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className='mt-[.24rem] bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem]'>
        <div
          className='h-[.7rem] grid items-center font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F]'
          style={{
            gridTemplateColumns: '20% 20% 20% 20% 20%',
          }}
        >
          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Node Address
          </div>

          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Pool Address
          </div>

          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Exited
          </div>

          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Election Time (UTC)
          </div>

          <div className='flex items-center justify-center text-[.16rem] text-color-text2'>
            Status
          </div>
        </div>

        {validatorElectionData.length == 0 && (
          <div className='h-[2rem] flex items-center justify-center'>
            <EmptyContent />
          </div>
        )}

        {validatorElectionData.length > 0 && (
          <div className='max-h-[4.2rem] overflow-auto'>
            {validatorElectionData.filter(
              (item: any) =>
                selectedFilter === 'all' || item.status === selectedFilter
            ).length === 0 ? (
              <div className='h-[2rem] flex items-center justify-center'>
                <EmptyContent />
              </div>
            ) : (
              validatorElectionData
                .filter(
                  (item: any) =>
                    selectedFilter === 'all' || item.status === selectedFilter
                )
                .map((item: any, index: number) => (
                  <div
                    key={index}
                    className={classNames(
                      'h-[.74rem] grid items-center font-[500]',
                      index % 2 === 0
                        ? 'bg-bgPage/50 dark:bg-bgPageDark/50'
                        : ''
                    )}
                    style={{
                      gridTemplateColumns: '20% 20% 20% 20% 20%',
                    }}
                  >
                    <div className='flex items-center justify-center text-[.16rem] text-color-text2 cursor-pointer'>
                      <div className='flex items-center'>
                        <div
                          className='mx-[.06rem]'
                          onClick={() => {
                            router.push(`/pubkey/${item.nodeAddress}`);
                          }}
                        >
                          {getShortAddress(item.nodeAddress, 4)}
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center justify-center text-[.16rem] text-color-text2 cursor-pointer'>
                      <div className='mx-[.06rem]'>
                        <a
                          href={
                            getValidatorInfoURL() +
                            'validator/' +
                            item.poolAddress
                          }
                          target='_blank'
                        >
                          {getShortAddress(item.poolAddress, 4)}
                        </a>
                      </div>
                    </div>

                    <div className='flex items-center justify-center text-[.16rem] cursor-pointer'>
                      <div className='mx-[.06rem]'>{item.statusSymbol}</div>
                    </div>

                    <div className='flex items-center justify-center text-[.16rem] text-color-text2 cursor-pointer'>
                      <div className='mx-[.06rem]'>
                        {moment.utc(item.timeStamp).format('D MMM YYYY h:mm a')}
                      </div>
                    </div>

                    <div className='flex items-center justify-center text-[.16rem] text-color-text2 cursor-pointer'>
                      <div className='mx-[.06rem]'>{item.status}</div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* <NodeElectionItem index={0} /> */}

        {/* <div className="my-[.32rem] flex items-center justify-center">
          <CustomPagination page={page} onChange={setPage} totalCount={1} />
        </div> */}
      </div>
    </div>
  );
};
