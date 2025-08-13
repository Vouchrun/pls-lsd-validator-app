import { Drawer } from '@mui/material';
import { DrawerNoticeList } from 'components/notice/DrawerNoticeList';
import { useAppDispatch, useAppSelector } from 'hooks/common';
import { RootState } from 'redux/store';

interface Props {
  open: boolean;
  onChangeOpen: (open: boolean) => void;
}

export const NoticeDrawer = (props: Props) => {
  const { open, onChangeOpen } = props;
  const { darkMode } = useAppSelector((state: RootState) => {
    return { darkMode: state.app.darkMode };
  });

  return (
    <Drawer
      anchor={'right'}
      open={open}
      onClose={() => onChangeOpen(false)}
      sx={{
        '& .MuiPaper-root': {
          background: darkMode ? '#333333' : '#e2e0d1',
          width: '300px',
          paddingTop: '1rem',
        },
      }}
    >
      <div className='pb-[1rem] flex-1 flex flex-col justify-between items-stretch pt-2'>
        <div className='px-[16px]'>
          <DrawerNoticeList open={open} />
        </div>
      </div>
    </Drawer>
  );
};
