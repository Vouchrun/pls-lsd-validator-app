import { useAppSlice } from 'hooks/selector';
import classNames from 'classnames';
import { BackNavigation } from './BackNavigation';

type Props = React.PropsWithChildren<{
  showBackButton?: boolean;
  onClickBack?: () => void;
}>;

export const PageTitleContainer = (props: Props) => {
  const { showBackButton, onClickBack } = props;
  const { darkMode } = useAppSlice();

  return (
    <div
      className={classNames(
        'flex justify-center ',
        showBackButton ? 'h-[1.56rem]' : 'h-[1.16rem]'
      )}
      style={{
        background: darkMode
          ? 'linear-gradient(180deg, #1B1B1F -20.69%, #1B1B1F80 103.45%)'
          : 'linear-gradient(180deg, rgba(255, 255, 255, 0) -20.69%, rgba(255, 255, 255, 0.5) 103.45%)',
        boxShadow: darkMode ? '0px 1px 0px #6C86AD4D' : '0px 1px 0px #FFFFFF',
      }}
    >
      <div className='w-smallContentW xl:w-contentW 2xl:w-largeContentW flex flex-col'>
        {showBackButton && onClickBack && (
          <div className='mb-[.24rem]'>
            <BackNavigation onClick={onClickBack} />
          </div>
        )}

        <div>{props.children}</div>
      </div>
    </div>
  );
};
