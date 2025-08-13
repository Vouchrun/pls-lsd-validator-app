import { useEffect, useState } from "react";
import { NoticeItem } from "./NoticeItem";
import { useAppDispatch } from "hooks/common";
import { LocalNotice, getNoticeList } from "utils/noticeUtils";
import { setUnreadNoticeFlag } from "redux/reducers/AppSlice";
import { STORAGE_KEY_UNREAD_NOTICE, removeStorage } from "utils/storageUtils";
import { EmptyContent } from "components/common/EmptyContent";

interface Props {
  open: boolean;
}

export const DrawerNoticeList = (props: Props) => {
  const { open } = props;
  const dispatch = useAppDispatch();
  const [noticeList, setNoticeList] = useState<LocalNotice[]>([]);

  useEffect(() => {
    if (open) {
      const noticeList = getNoticeList();
      setNoticeList(noticeList);

      dispatch(setUnreadNoticeFlag(false));
      removeStorage(STORAGE_KEY_UNREAD_NOTICE);
    }
  }, [dispatch, open]);

  const updateNoticeList = () => {
    const noticeList = getNoticeList();
    setNoticeList(noticeList.slice(0, 3));
  };

  return (
    <div className="pt-[24px]">
      {noticeList.length === 0 && <EmptyContent mt="1rem" />}
      {noticeList.map((notice, index) => (
        <div key={notice.id}>
          <NoticeItem
            notice={notice}
            visible={open}
            onUpdate={updateNoticeList}
          />

          {index !== noticeList.length - 1 && (
            <div className="h-[0.02rem] bg-color-divider2" />
          )}
        </div>
      ))}
    </div>
  );
};
