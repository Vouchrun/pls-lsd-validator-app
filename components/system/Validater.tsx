import { CustomButton } from 'components/common/CustomButton';
import { DataLoading } from 'components/common/DataLoading';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import { useAppSlice } from 'hooks/selector';
import { useNetworkProposalData } from 'hooks/useNetworkProposalData';
import { useWalletAccount } from 'hooks/useWalletAccount';
import { useEffect, useState } from 'react';
import { fetchValidatorData } from 'redux/reducers/ValidatorNodeAddress';

import { addTrustNode, removeTrustNode } from 'redux/reducers/ValidatorSlice';
import { useWriteContract } from 'wagmi';

const TableSkeleton = () => {
  return (
    <tbody>
      {[...Array(5)].map((_, index) => (
        <tr
          key={index + 1}
          className='border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-white last:border-0'
        >
          <td className='px-[30px] py-[15px]'>
            <DataLoading height='20px' />
          </td>
          <td className='px-[30px] py-[15px]'>
            <div className='flex justify-center'>
              <div className='w-[20px]'>
                <DataLoading height='20px' />
              </div>
            </div>
          </td>
          <td className='px-[30px] py-[15px]'>
            <div className='flex justify-center'>
              <div className='w-[30px]'>
                <DataLoading height='20px' />
              </div>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

export default function Validater({ nodes }: any) {
  const dispatch = useAppDispatch();
  const { darkMode } = useAppSlice();
  const { metaMaskAccount } = useWalletAccount();
  const { admin } = useNetworkProposalData();
  const [voterAddress, setVoterAddress] = useState('');
  const { writeContractAsync } = useWriteContract();
  const [filter, setFilter] = useState('All');

  // Get validator data from Redux store
  const {
    validatorNodeAddressData,
    validatorTrustedNodeAddressData,
    loading,
    error,
  } = useAppSelector((state) => state.validatorNodeAddressState);

  useEffect(() => {
    if (nodes && nodes?.length > 0) {
      dispatch(fetchValidatorData(nodes));
    }
  }, [dispatch, nodes]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  const getRowClassName = (isDarkMode: boolean) => {
    if (isDarkMode) {
      return 'border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1 last:border-0';
    }
    return 'border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1 last:border-0';
  };

  const getStatusIcon = (status: string) => {
    return status === 'slashed'
      ? '🔴 Slashed'
      : status === 'inactive'
      ? '🟡 Low Balance, Leaking'
      : '🟢 Active, OK';
  };

  const getInputClassName = (isDarkMode: boolean) => {
    if (isDarkMode) {
      return 'w-full rounded-[35px] bg-[#1B1B1F] text-center h-[42px] border-[0.01rem] border-[#6C86AD80]';
    }
    return 'w-full rounded-[35px] bg-[#fff] text-center h-[42px] border-[0.01rem] border-[#6C86AD80]';
  };

  const renderTableBody = (filter: string) => {
    if (loading) {
      return <TableSkeleton />;
    }

    if (error) {
      return (
        <tbody>
          <tr>
            <td colSpan={3} className='text-center py-[30px] text-red-500'>
              {error}
            </td>
          </tr>
        </tbody>
      );
    }

    if (
      filter === 'All'
        ? validatorNodeAddressData.length === 0
        : validatorTrustedNodeAddressData.length === 0
    ) {
      return (
        <tbody>
          <tr>
            <td colSpan={3} className='text-center py-[30px] text-white-500'>
              No validator data available
            </td>
          </tr>
        </tbody>
      );
    }
    return (
      <tbody>
        {(filter === 'All'
          ? validatorNodeAddressData
          : validatorTrustedNodeAddressData
        ).map((node: any, index: number) => (
          <tr key={index + 1} className={getRowClassName(darkMode)}>
            <td className='text-left text-[13px] truncate px-[30px] py-[15px]'>
              {node.address}
            </td>
            <td className='text-center font-semibold px-[30px] py-[15px]'>
              {node.activeCount > 0 ? getStatusIcon(node.status) : '--'}
            </td>
            <td className='text-center font-semibold px-[30px] py-[15px]'>
              {node.activeCount}
            </td>
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <div className='bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem] overflow-hidden'>
      <div className='bg-bgPage/50 dark:bg-bgPageDark/50'>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[800px]'>
            <thead>
              <tr>
                <th className='bg-color-bg2 text-left font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[.16rem] text-color-text2 px-[30px] py-[30px]'>
                  <div className='flex items-center'>
                    Validator Node Address
                    <div className='flex items-center ml-1'>
                      <label htmlFor='All' className='cursor-pointer'>
                        <input
                          type='radio'
                          name='option'
                          id='All'
                          className='hidden peer'
                          value='All'
                          checked={filter === 'All'}
                          onChange={(e) => {
                            setFilter((e.target as HTMLInputElement).value);
                          }}
                        />
                        <div className='peer-checked:text-[#fe8a3d]'>All</div>
                      </label>
                      <div className='mx-[5px]'>|</div>
                      <label htmlFor='Trusted' className='cursor-pointer'>
                        <input
                          type='radio'
                          name='option'
                          id='Trusted'
                          className='hidden peer'
                          value='Trusted'
                          checked={filter === 'Trusted'}
                          onChange={(e) => {
                            setFilter((e.target as HTMLInputElement).value);
                          }}
                        />
                        <div className='peer-checked:text-[#fe8a3d]'>
                          Trusted
                        </div>
                      </label>
                    </div>
                  </div>
                </th>
                <th className='bg-color-bg2 font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[.16rem] text-color-text2 px-[30px] py-[30px]'>
                  Node Health
                </th>
                <th className='bg-color-bg2 font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[.16rem] text-color-text2 px-[30px] py-[30px]'>
                  Active Validators
                </th>
              </tr>
            </thead>
            {renderTableBody(filter)}
          </table>
        </div>
        <div className='text-[.14rem] text-color-text1 mt-5 text-center pb-[30px] max-w-[422px] mx-auto'>
          <input
            type='text'
            placeholder='Enter Trusted Node Address'
            value={voterAddress}
            onChange={(e) => setVoterAddress(e.target.value)}
            className={getInputClassName(darkMode)}
          />
          <div className='mt-[10px] max-w-[100%] mx-auto flex items-center gap-1 w-[100%] justify-center'>
            <CustomButton
              type='small'
              height='.42rem'
              width='130px'
              disabled={admin !== metaMaskAccount}
              onClick={() => {
                dispatch(addTrustNode(writeContractAsync, voterAddress));
              }}
            >
              Add
            </CustomButton>
            <CustomButton
              type='small'
              height='.42rem'
              width='130px'
              disabled={admin !== metaMaskAccount}
              onClick={() => {
                dispatch(removeTrustNode(writeContractAsync, voterAddress));
              }}
            >
              Remove
            </CustomButton>
          </div>
        </div>
      </div>
    </div>
  );
}
