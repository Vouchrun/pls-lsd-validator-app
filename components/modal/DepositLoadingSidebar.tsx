import classNames from 'classnames';
import { Icomoon } from 'components/icon/Icomoon';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import { useAppSlice } from 'hooks/selector';
import Image from 'next/image';
import loading from 'public/images/loading.png';
import checkFileError from 'public/images/tx_error.png';
import checkFileSuccess from 'public/images/tx_success.png';
import { updateDepositLoadingParams } from 'redux/reducers/AppSlice';
import { RootState } from 'redux/store';
import commonStyles from 'styles/Common.module.scss';

export const DepositLoadingSidebar = () => {
  const { darkMode } = useAppSlice();
  const dispatch = useAppDispatch();
  const { depositLoadingParams } = useAppSelector((state: RootState) => {
    return {
      depositLoadingParams: state.app.depositLoadingParams,
    };
  });

  return (
    <div
      className={classNames(
        'mt-[.2rem] rounded-l-[.16rem] h-[.7rem] w-[1.9rem] flex items-center cursor-pointer border-solid border-[0.01rem] border-color-border1',
        {
          hidden:
            depositLoadingParams?.modalVisible === true ||
            !depositLoadingParams,
        }
      )}
      style={{
        backgroundColor: darkMode ? '#1B1B1F' : '#ffffff80',
        backdropFilter: 'blur(.13rem)',
        zIndex: 2000,
      }}
      onClick={() => {
        dispatch(updateDepositLoadingParams({ modalVisible: true }));
      }}
    >
      <div
        className={classNames(
          'ml-[.16rem] relative w-[.32rem] h-[.32rem]',
          depositLoadingParams?.status === 'loading' ? commonStyles.loading : ''
        )}
      >
        <Image
          src={
            depositLoadingParams?.status === 'success'
              ? checkFileSuccess
              : depositLoadingParams?.status === 'error'
              ? checkFileError
              : loading
          }
          layout='fill'
          alt='loading'
        />
      </div>

      <div
        className={classNames(
          'ml-[.16rem] text-[.16rem] leading-normal',
          depositLoadingParams?.status === 'success'
            ? 'text-color-text1'
            : depositLoadingParams?.status === 'error'
            ? 'text-error'
            : 'text-color-text2'
        )}
      >
        Deposit
        <br />
        {depositLoadingParams?.status === 'success'
          ? 'Succeed'
          : depositLoadingParams?.status === 'error'
          ? 'Failed'
          : 'Operating'}
      </div>

      <div className='ml-[.2rem] rotate-90'>
        <Icomoon icon='right' color='#6C86AD' size='.16rem' />
      </div>
    </div>
  );
};
