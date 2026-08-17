import { CustomButton } from "components/common/CustomButton";
import { DataLoading } from "components/common/DataLoading";
import { useAppDispatch, useAppSelector } from "hooks/common";
import { useAppSlice } from "hooks/selector";
import { useNetworkProposalData } from "hooks/useNetworkProposalData";
import { useWalletAccount } from "hooks/useWalletAccount";
import { useEffect, useState } from "react";
import { fetchValidatorData } from "redux/reducers/ValidatorNodeAddress";
import { useNodeUnclaimedRewards } from "hooks/useNodeUnclaimedRewards";
import {
  addTrustNode,
  batchClaimValidatorRewards,
  removeTrustNode,
} from "redux/reducers/ValidatorSlice";
import snackbarUtil from "utils/snackbarUtils";
import { useWriteContract } from "wagmi";
import Image from "next/image";
import doubleLeftIcon from "public/images/double-left.svg";
import doubleRightIcon from "public/images/double-right.svg";
import leftIcon from "public/images/arrow-left.svg";
import rightIcon from "public/images/arrow-right.svg";

const UnclaimedRewardsCell = ({
  address,
  onHasUnclaimedChange,
}: {
  address: string;
  onHasUnclaimedChange?: (address: string, hasUnclaimed: boolean) => void;
}) => {
  const { unclaimedRewards, hasUnclaimed, isLoading, error } =
    useNodeUnclaimedRewards(address);

  useEffect(() => {
    if (!isLoading && onHasUnclaimedChange) {
      onHasUnclaimedChange(address, hasUnclaimed);
    }
  }, [address, hasUnclaimed, isLoading, onHasUnclaimedChange]);

  if (isLoading) {
    return <DataLoading height="20px" />;
  }

  if (error) {
    return <span className="text-red-500">Error loading rewards</span>;
  }

  return <span>{unclaimedRewards}</span>;
};

const TableSkeleton = () => {
  return (
    <tbody>
      {[...Array(5)].map((_, index) => (
        <tr
          key={index + 1}
          className="border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-white last:border-0"
        >
          <td className="px-[30px] py-[15px]">
            <DataLoading height="20px" />
          </td>
          <td className="px-[30px] py-[15px]">
            <div className="flex justify-center">
              <div className="w-[20px]">
                <DataLoading height="20px" />
              </div>
            </div>
          </td>
          <td className="px-[30px] py-[15px]">
            <div className="flex justify-center">
              <div className="w-[30px]">
                <DataLoading height="20px" />
              </div>
            </div>
          </td>
          <td className="px-[30px] py-[15px]">
            <div className="flex justify-center">
              <div className="w-[30px]">
                <DataLoading height="20px" />
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
  const [voterAddress, setVoterAddress] = useState("");
  const { writeContractAsync } = useWriteContract();
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [claimableMap, setClaimableMap] = useState<Record<string, boolean>>({});
  const claimRewardsLoading = useAppSelector(
    (state) => state.validator.claimRewardsLoading
  );

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
      return "border-b-[0.01rem] border-[#303745] text-[.14rem] text-color-text1 last:border-0";
    }
    return "border-b-[0.01rem] border-[#ffffff] text-[.14rem] text-color-text1 last:border-0";
  };

  const getStatusIcon = (status: string) => {
    return status === "slashed"
      ? "🔴 Slashed"
      : status === "inactive"
      ? "🟡 Low Balance, Leaking"
      : "🟢 Active, OK";
  };

  const getInputClassName = (isDarkMode: boolean) => {
    if (isDarkMode) {
      return "w-full rounded-[35px] bg-[#1B1B1F] text-center h-[42px] border-[0.01rem] border-[#6C86AD80]";
    }
    return "w-full rounded-[35px] bg-[#fff] text-center h-[42px] border-[0.01rem] border-[#6C86AD80]";
  };

  const handleChangeResultsPerPage = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setResultsPerPage(Number(event.target.value));
    setCurrentPage(1);
  };

  const data =
    filter === "All"
      ? validatorNodeAddressData
      : validatorTrustedNodeAddressData;
  const totalPages = Math.ceil(data.length / resultsPerPage);

  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = Math.min(startIndex + resultsPerPage, data.length);
  const paginatedData = data.slice(startIndex, endIndex);

  const handleCheckboxChange = (item: string) => (event: any) => {
    if (event.target.checked) {
      setCheckedItems((prev) => [...prev, item]);
    } else {
      setCheckedItems((prev) =>
        prev.filter((checkedItem) => checkedItem !== item)
      );
    }
  };

  const handleAllSelected = (event: any) => {
    if (event.target.checked) {
      setAllSelected(true);
      paginatedData.map((node: any) => {
        if (claimableMap[node.address]) {
          setCheckedItems((prev) => [...prev, node.address]);
        }
      });
    } else {
      setCheckedItems([]);
      setAllSelected(false);
    }
  };

  const handleHasUnclaimedChange = (address: string, hasUnclaimed: boolean) => {
    setClaimableMap((prev) => {
      if (prev[address] === hasUnclaimed) return prev;
      return { ...prev, [address]: hasUnclaimed };
    });
  };

  const handleRunClaim = () => {
    if (checkedItems.length === 0) return;
    dispatch(
      batchClaimValidatorRewards(writeContractAsync, checkedItems, (success) => {
        if (success) {
          setCheckedItems([]);
          setAllSelected(false);
          snackbarUtil.success("Batch claim submitted");
        }
      })
    );
  };

  const handleFirstPage = () => {
    setAllSelected(false);
    setCheckedItems([]);
    setCurrentPage(1);
  };
  const handlePreviousPage = () => {
    setAllSelected(false);
    setCheckedItems([]);
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };
  const handleNextPage = () => {
    setAllSelected(false);
    setCheckedItems([]);
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };
  const handleLastPage = () => {
    setAllSelected(false);
    setCheckedItems([]);
    setCurrentPage(totalPages);
  };

  const renderTableBody = (filter: string) => {
    if (loading) {
      return <TableSkeleton />;
    }

    if (error) {
      return (
        <tbody>
          <tr>
            <td colSpan={3} className="text-center py-[30px] text-red-500">
              {error}
            </td>
          </tr>
        </tbody>
      );
    }

    if (
      filter === "All"
        ? validatorNodeAddressData.length === 0
        : validatorTrustedNodeAddressData.length === 0
    ) {
      return (
        <tbody>
          <tr>
            <td colSpan={3} className="text-center py-[30px] text-white-500">
              No validator data available
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <>
        <tbody>
          {paginatedData.map((node: any, index: number) => (
            <tr
              key={startIndex + index + 1}
              className={getRowClassName(darkMode)}
            >
              <td className="text-left text-[14px] md:text-[16px] truncate px-[30px] py-[15px]">
                {node.address}
              </td>
              <td className="text-center font-semibold px-[30px] py-[15px] text-[14px] md:text-[16px]">
                {node.activeCount > 0 ? getStatusIcon(node.status) : "--"}
              </td>
              <td className="text-center font-semibold px-[30px] py-[15px] text-[12px] sm:text-[.16rem]">
                <UnclaimedRewardsCell
                  address={node.address}
                  onHasUnclaimedChange={handleHasUnclaimedChange}
                />
              </td>
              <td className="text-center font-semibold px-[30px] py-[15px] text-[14px] md:text-[16px]">
                {node.activeCount}
              </td>
              <td className="text-center px-[30px] py-[15px]">
                <input
                  type="checkbox"
                  checked={checkedItems.includes(node.address)}
                  disabled={!claimableMap[node.address]}
                  onChange={handleCheckboxChange(node.address)}
                />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={3}>
              <div className="flex items-center justify-center mt-1 md:flex-row flex-col p-[.16rem]">
                <div className="flex items-center">
                  <div className="text-[#FE8A3C] text-[14px] mr-[10px]">
                    Result per page
                  </div>
                  <select
                    value={resultsPerPage}
                    onChange={handleChangeResultsPerPage}
                    className="cursor-pointer px-[.16rem] h-[.42rem] inline-flex items-center justify-between rounded-[4px] border-[0.01rem] border-[#6C86AD80] bg-transparent shadow-none outline-none"
                    style={{ color: "#6C86AD" }}
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={40}>40</option>
                    <option value={80}>80</option>
                    <option value={100}>100</option>
                  </select>
                </div>
                <div className="text-[#FE8A3C] text-[14px] mx-[40px] md:my-0 my-[15px] flex">
                  {startIndex + 1}-{endIndex} of {data.length}
                </div>
                <div className="flex items-center">
                  <button
                    onClick={handleFirstPage}
                    disabled={currentPage === 1}
                    className="cursor-pointer h-[.42rem] w-[40px] rounded-[4px] mx-[3px] border-none flex items-center justify-center bg-gradient-to-r from-[#FE8A3C] via-[#E79D6C] to-[#FE8A3C] disabled:opacity-50"
                  >
                    <Image
                      src={doubleLeftIcon}
                      alt="First Page"
                      height={12}
                      width={16}
                    />
                  </button>
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className="cursor-pointer h-[.42rem] w-[40px] rounded-[4px] mx-[3px] border-none flex items-center justify-center bg-gradient-to-r from-[#FE8A3C] via-[#E79D6C] to-[#FE8A3C] disabled:opacity-50"
                  >
                    <Image
                      src={leftIcon}
                      alt="Previous Page"
                      height={5}
                      width={9}
                    />
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className="cursor-pointer h-[.42rem] w-[40px] rounded-[4px] mx-[3px] border-none flex items-center justify-center bg-gradient-to-r from-[#FE8A3C] via-[#E79D6C] to-[#FE8A3C] disabled:opacity-50"
                  >
                    <Image
                      src={rightIcon}
                      alt="Next Page"
                      height={5}
                      width={9}
                    />
                  </button>
                  <button
                    onClick={handleLastPage}
                    disabled={currentPage === totalPages}
                    className="cursor-pointer h-[.42rem] w-[40px] rounded-[4px] border-none mx-[3px] flex items-center justify-center bg-gradient-to-r from-[#FE8A3C] via-[#E79D6C] to-[#FE8A3C] disabled:opacity-50"
                  >
                    <Image
                      src={doubleRightIcon}
                      alt="Last Page"
                      height={12}
                      width={16}
                    />
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tfoot>
      </>
    );
  };

  return (
    <div className="bg-color-bg2 border-[0.01rem] border-color-border1 rounded-[.3rem] overflow-hidden">
      <div className="bg-bgPage/50 dark:bg-bgPageDark/50">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="bg-[#E2E0D0] dark:bg-[#333333] text-left font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[14px] md:text-[16px] text-color-text2 px-[30px] py-[30px]">
                  <div className="flex items-center">
                    Validator Node Address
                    <div className="flex items-center ml-1">
                      <label htmlFor="All" className="cursor-pointer">
                        <input
                          type="radio"
                          name="option"
                          id="All"
                          className="hidden peer"
                          value="All"
                          checked={filter === "All"}
                          onChange={(e) => {
                            setFilter((e.target as HTMLInputElement).value);
                          }}
                        />
                        <div className="peer-checked:text-[#fe8a3d]">All</div>
                      </label>
                      <div className="mx-[5px]">|</div>
                      <label htmlFor="Trusted" className="cursor-pointer">
                        <input
                          type="radio"
                          name="option"
                          id="Trusted"
                          className="hidden peer"
                          value="Trusted"
                          checked={filter === "Trusted"}
                          onChange={(e) => {
                            setFilter((e.target as HTMLInputElement).value);
                          }}
                        />
                        <div className="peer-checked:text-[#fe8a3d]">
                          Trusted
                        </div>
                      </label>
                    </div>
                  </div>
                </th>
                <th className="bg-[#E2E0D0] dark:bg-[#333333] font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[14px] md:text-[16px] text-color-text2 px-[30px] py-[30px]">
                  Node Health
                </th>
                <th className="bg-[#E2E0D0] dark:bg-[#333333] font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[14px] md:text-[16px] text-color-text2 px-[30px] py-[30px]">
                  Unclaimed Rewards
                </th>
                <th className="bg-[#E2E0D0] dark:bg-[#333333] font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[14px] md:text-[16px] text-color-text2 px-[30px] py-[30px]">
                  Active Validators
                </th>
                <th className="bg-[#E2E0D0] dark:bg-[#333333] font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[14px] md:text-[16px] text-color-text2 px-[30px] py-[30px]">
                  <div className="flex items-center">
                    Claim
                    <input
                      type="checkbox"
                      className="ml-[.24rem]"
                      checked={allSelected}
                      onChange={(e) => handleAllSelected(e)}
                    />
                  </div>
                </th>
              </tr>
            </thead>
            {renderTableBody(filter)}
          </table>
        </div>
        <div className="text-[14px] text-color-text1 mt-5 text-center pb-[30px] max-w-[422px] mx-auto">
          <input
            type="text"
            placeholder="Enter Trusted Node Address"
            value={voterAddress}
            onChange={(e) => setVoterAddress(e.target.value)}
            // className={getInputClassName(darkMode)}
            className={
              darkMode
                ? "w-full rounded-[35px] bg-[#1B1B1F] text-center h-[42px] border-[0.01rem] border-color-border1 text-[#8E9397] text-[14px] outline-none focus:border-[#ff4400]/30"
                : "w-full rounded-[35px] bg-[#fff] text-center h-[42px] border-[0.01rem] border-color-border1 text-[#7D794F] text-[14px] outline-none focus:border-[#ff4400]/30"
            }
          />
          <div className="mt-[10px] max-w-[100%] mx-auto flex items-center gap-1 w-[100%] justify-center">
            <CustomButton
              type="small"
              height="42px"
              width="130px"
              disabled={checkedItems.length === 0 || claimRewardsLoading}
              onClick={handleRunClaim}
            >
              Run Claim
            </CustomButton>
            <CustomButton
              type="small"
              height="42px"
              width="130px"
              disabled={admin !== metaMaskAccount}
              onClick={() => {
                dispatch(addTrustNode(writeContractAsync, voterAddress));
              }}
            >
              Add
            </CustomButton>
            <CustomButton
              type="small"
              height="42px"
              width="130px"
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
