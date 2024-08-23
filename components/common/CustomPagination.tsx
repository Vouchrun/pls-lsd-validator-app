import { Pagination } from '@mui/material';
import { useAppSelector } from 'hooks/common';
import { RootState } from 'redux/store';

interface CustomPaginationProps {
  totalCount: number;
  page: number;
  onChange: (page: number) => void;
}

export const CustomPagination = (props: CustomPaginationProps) => {
  const { darkMode } = useAppSelector((state: RootState) => {
    return {
      darkMode: state.app.darkMode,
    };
  });
  const pageCount = Math.ceil(props.totalCount / 10);

  return (
    <Pagination
      shape='rounded'
      count={pageCount}
      page={props.page}
      onChange={(_, page) => props.onChange(page)}
      sx={{
        '& .MuiPaginationItem-root': {
          color: darkMode ? '#FFFFFF80' : '#6C86AD',
          fontSize: '.14rem',
          width: '.2rem',
          height: '.2rem',
          padding: '0',
          minWidth: '.2rem',
          border: darkMode ? 'solid 1px #FFFFFF80' : 'solid 1px #6C86AD4D',
        },
        '& .MuiPaginationItem-root.Mui-selected': {
          background: darkMode ? '#E8EFFD' : '#1B1B1F',
          color: darkMode ? '#1B1B1F' : '#FFFFFF',
        },
        '& .MuiPaginationItem-icon': {
          width: '0.15rem',
          height: '0.25rem',
        },
      }}
    />
  );
};
