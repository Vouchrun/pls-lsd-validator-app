import classNames from 'classnames';
import { CustomTag } from 'components/common/CustomTag';
import { DataLoading } from 'components/common/DataLoading';
import { PageTitleContainer } from 'components/common/PageTitleContainer';
import { PoolAssets } from 'components/pool/PoolAssets';
import ProtocolRevenue from 'components/system/ProtocolRevenue';
import ProtocolStatus from 'components/system/ProtocolStatus';
import Validater from 'components/system/Validater';
import Voter from 'components/system/Voter';
import VouchContracts from 'components/system/VouchContracts';
import { robotoBold } from 'config/font';
import { useAppSlice } from 'hooks/selector';
import { useApr } from 'hooks/useApr';
import { useNetworkProposalData } from 'hooks/useNetworkProposalData';
import { usePoolData } from 'hooks/usePoolData';
import { usePoolPubkeyData } from 'hooks/usePoolPubkeyData';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getLsdTokenName } from 'utils/configUtils';
import { getLsdTokenIcon } from 'utils/iconUtils';
import { formatNumber } from 'utils/numberUtils';
import { useAccount } from 'wagmi';

const SystemPage = () => {
  const { apr } = useApr();
  const { voters, voteManagerAddress } = useNetworkProposalData();
  const { nodes } = usePoolPubkeyData();
  const { admin } = useNetworkProposalData();
  const { address: metaMaskAccount, isConnected } = useAccount();
  const router = useRouter();
  const [showPage, setShowPage] = useState<null | boolean>(null);

  useEffect(() => {
    // Check the conditions before rendering the page

    const checkConditions = async () => {
      if (
        admin === metaMaskAccount || // Allow if the user is the admin
        nodes.some((node: any) => metaMaskAccount === node) || // Allow if the user is in the nodes list
        voters.some((voter: any) => metaMaskAccount === voter) // Allow if the user is a voter
      ) {
        setShowPage(true); // If condition passes, allow rendering the page
      } else {
        await router.push('/'); // Redirect if the condition fails
      }
    };

    if (admin && metaMaskAccount && nodes.length > 0) {
      checkConditions();
    }
    if (!isConnected) {
      router.push('/');
    }
  }, [nodes, voters, admin, metaMaskAccount, router, isConnected]);

  if (showPage === null) {
    return null; // Render nothing while the condition is being checked
  }

  return (
    <div>
      <PageTitleContainer>
        <div className='h-full flex items-center w-smallContentW xl:w-contentW 2xl:w-largeContentW'>
          <div className='w-[.68rem] h-[.68rem] relative'>
            <Image src={getLsdTokenIcon()} layout='fill' alt='icon' />
          </div>

          <div>
            <div className='ml-[.12rem] flex items-center'>
              <div
                className={classNames(
                  robotoBold.className,
                  'text-[.34rem] text-color-text1'
                )}
              >
                {getLsdTokenName()} Pool
              </div>

              <CustomTag type='apr' ml='.12rem'>
                {apr === undefined ? (
                  <DataLoading height='.12rem' />
                ) : (
                  `${formatNumber(apr, { decimals: 2 })}%`
                )}
                <span className='ml-[.06rem]'>staking APR</span>
              </CustomTag>
            </div>

            <div className='ml-[.12rem] mt-[.12rem] text-[.12rem] text-color-text2 cursor-pointer'>
              <div className='flex items-center'>
                <div className='mr-[.06rem]'>
                  Take part in rPool programs, earn tokens easily.
                </div>
              </div>
            </div>
          </div>
        </div>
      </PageTitleContainer>

      <div className='w-smallContentW xl:w-contentW 2xl:w-largeContentW mx-auto mb-[.56rem]'>
        <PoolAssets />
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-1 mt-1'>
          <div>
            <ProtocolStatus />
          </div>
          <div>
            <ProtocolRevenue />
          </div>
          <div>
            <VouchContracts />
          </div>
        </div>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-1 mt-1'>
          <div>
            <Voter voters={voters} voteManagerAddress={voteManagerAddress} />
          </div>
          <div>
            <Validater nodes={nodes} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemPage;
