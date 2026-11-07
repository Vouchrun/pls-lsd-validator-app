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
  batchSweepValidatorRewards,
  removeTrustNode,
} from "redux/reducers/ValidatorSlice";
import snackbarUtil from "utils/snackbarUtils";
import { SweepRunResult } from "interfaces/sweep";
import {
  clearSweepSession,
  loadSweepSession,
  StoredSweepSession,
} from "utils/sweepSession";
import { useSignTypedData, useWriteContract } from "wagmi";
import Image from "next/image";
import doubleLeftIcon from "public/images/double-left.svg";
import doubleRightIcon from "public/images/double-right.svg";
import leftIcon from "public/images/arrow-left.svg";
import rightIcon from "public/images/arrow-right.svg";

const UnclaimedRewardsCell = ({
  address,
  onActionableChange,
}: {
  address: string;
  onActionableChange?: (address: string, actionable: boolean) => void;
}) => {
  const {
    unclaimedRewards,
    hasUnclaimed,
    hasBalance,
    isContract,
    isLoading,
    error,
  } = useNodeUnclaimedRewards(address);

  useEffect(() => {
    if (!isLoading && onActionableChange) {
      onActionableChange(
        address,
        hasUnclaimed || (hasBalance && isContract)
      );
    }
  }, [
    address,
    hasUnclaimed,
    hasBalance,
    isContract,
    isLoading,
    onActionableChange,
  ]);

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
  const { signTypedDataAsync } = useSignTypedData();
  const [destination, setDestination] = useState("");
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage, setResultsPerPage] = useState(10);
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [actionableMap, setActionableMap] = useState<Record<string, boolean>>({});
  const [dryRun, setDryRun] = useState(false);
  const [sweepResults, setSweepResults] = useState<SweepRunResult | null>(null);
  const [resumeSession, setResumeSession] =
    useState<StoredSweepSession | null>(null);
  const claimRewardsLoading = useAppSelector(
    (state) => state.validator.claimRewardsLoading
  );
  const sweepProgress = useAppSelector(
    (state) => state.validator.sweepProgress
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

  useEffect(() => {
    const session = loadSweepSession();
    if (
      session &&
      metaMaskAccount &&
      session.signer.toLowerCase() === metaMaskAccount.toLowerCase()
    ) {
      setResumeSession(session);
    } else {
      setResumeSession(null);
    }
  }, [metaMaskAccount]);

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
      // Select every row that has not been explicitly ruled out. Rows that
      // have not been evaluated yet remain selectable: the sweep pre-flight
      // is the authoritative eligibility check, not the rewards/IPFS hook.
      const selectable = data
        .filter((node: any) => actionableMap[node.address] !== false)
        .map((node: any) => node.address);
      setCheckedItems(Array.from(new Set(selectable)));
    } else {
      setCheckedItems([]);
      setAllSelected(false);
    }
  };

  const handleActionableChange = (address: string, actionable: boolean) => {
    setActionableMap((prev) => {
      if (prev[address] === actionable) return prev;
      return { ...prev, [address]: actionable };
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

  const handleRunSweep = () => {
    if (checkedItems.length === 0 || !destination) return;
    setSweepResults(null);
    dispatch(
      batchSweepValidatorRewards(
        writeContractAsync,
        signTypedDataAsync,
        checkedItems,
        destination,
        {
          dryRun,
          onResult: (result) => {
            setSweepResults(result);
            setResumeSession(loadSweepSession());
            if (result.txHash) {
              setCheckedItems([]);
              setAllSelected(false);
            }
          },
        }
      )
    );
  };

  const handleResume = () => {
    if (!resumeSession) return;
    setDestination(resumeSession.destination);
    setCheckedItems(resumeSession.items.map((item) => item.address));
    setAllSelected(false);
  };

  const handleClearResume = () => {
    clearSweepSession();
    setResumeSession(null);
  };

  // Selection is kept across pages: a sweep usually covers more than one page.
  const handleFirstPage = () => {
    setCurrentPage(1);
  };
  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };
  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };
  const handleLastPage = () => {
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
            <td colSpan={5} className="text-center py-[30px] text-red-500">
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
            <td colSpan={5} className="text-center py-[30px] text-white-500">
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
                  onActionableChange={handleActionableChange}
                />
              </td>
              <td className="text-center font-semibold px-[30px] py-[15px] text-[14px] md:text-[16px]">
                {node.activeCount}
              </td>
              <td className="text-center px-[30px] py-[15px]">
                <input
                  type="checkbox"
                  checked={checkedItems.includes(node.address)}
                  disabled={actionableMap[node.address] === false}
                  onChange={handleCheckboxChange(node.address)}
                />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5}>
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
                <th className="bg-[#E2E0D0] dark:bg-[#333333] font-[500] border-solid border-b-[.01rem] border-white dark:border-[#1B1B1F] text-[14px] md:text-[16px] text-color-text2 px-[30px] py-[15px]">
                  <div className="flex flex-col items-center justify-center gap-[.06rem]">
                    <span>Select</span>
                    <input
                      type="checkbox"
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
        <div className="text-[14px] text-color-text1 mt-5 text-center pb-[30px] max-w-[950px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-[20px]">
          <div className="flex flex-col items-center">
            <input
              type="text"
              placeholder="Enter Trusted Node Address"
              value={voterAddress}
              onChange={(e) => setVoterAddress(e.target.value)}
              className={
                darkMode
                  ? "w-full rounded-[35px] bg-[#1B1B1F] text-center h-[42px] border-[0.01rem] border-color-border1 text-[#8E9397] text-[14px] outline-none focus:border-[#ff4400]/30"
                  : "w-full rounded-[35px] bg-[#fff] text-center h-[42px] border-[0.01rem] border-color-border1 text-[#7D794F] text-[14px] outline-none focus:border-[#ff4400]/30"
              }
            />
            <div className="mt-[10px] flex items-center gap-1 w-[100%] justify-center">
              <CustomButton
                type="small"
                height="42px"
                width="170px"
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
                width="170px"
                disabled={admin !== metaMaskAccount}
                onClick={() => {
                  dispatch(removeTrustNode(writeContractAsync, voterAddress));
                }}
              >
                Remove
              </CustomButton>
            </div>
          </div>
          <div className="flex flex-col items-center">
            {resumeSession && (
              <div className="w-full mb-[8px] rounded-[6px] border border-color-border1 px-3 py-2 text-[12px] text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-color-text2 truncate">
                    Unfinished sweep: {resumeSession.items.length} signed
                    {" → "}
                    {resumeSession.destination}
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className="underline text-[#FE8A3C]"
                      onClick={handleResume}
                    >
                      Resume
                    </button>
                    <button
                      type="button"
                      className="underline text-color-text2"
                      onClick={handleClearResume}
                    >
                      Discard
                    </button>
                  </span>
                </div>
              </div>
            )}
            <input
              type="text"
              placeholder="Sweep destination address"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className={
                darkMode
                  ? "w-full rounded-[35px] bg-[#1B1B1F] text-center h-[42px] border-[0.01rem] border-color-border1 text-[#8E9397] text-[14px] outline-none focus:border-[#ff4400]/30"
                  : "w-full rounded-[35px] bg-[#fff] text-center h-[42px] border-[0.01rem] border-color-border1 text-[#7D794F] text-[14px] outline-none focus:border-[#ff4400]/30"
              }
            />
            <div className="mt-[10px] flex items-center justify-center gap-2 w-[100%] flex-wrap">
              <CustomButton
                type="small"
                height="42px"
                width="140px"
                disabled={checkedItems.length === 0 || claimRewardsLoading}
                onClick={handleRunClaim}
              >
                Run Claim
              </CustomButton>
              <div className="flex items-center gap-2">
                <CustomButton
                  type="small"
                  height="42px"
                  width="140px"
                  disabled={
                    checkedItems.length === 0 ||
                    claimRewardsLoading ||
                    !destination
                  }
                  onClick={handleRunSweep}
                >
                  {dryRun
                    ? `Dry Run (${checkedItems.length})`
                    : `Sweep (${checkedItems.length})`}
                </CustomButton>
                <label className="flex items-center gap-1 text-[12px] text-color-text2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dryRun}
                    onChange={(e) => setDryRun(e.target.checked)}
                  />
                  Dry run
                </label>
              </div>
            </div>
            {sweepProgress.phase !== "idle" &&
              sweepProgress.phase !== "done" && (
                <div className="mt-[6px] text-[12px] text-color-text2 text-center break-all">
                  {sweepProgress.phase === "preflight" && "Checking Safes…"}
                  {sweepProgress.phase === "signing" &&
                    `Signing ${sweepProgress.signed}/${sweepProgress.total}…`}
                  {sweepProgress.phase === "executing" &&
                    "Submitting multiSend…"}
                  {sweepProgress.address ? ` ${sweepProgress.address}` : ""}
                </div>
              )}
            {sweepResults && sweepResults.items.length > 0 && (
              <div className="mt-[10px] w-full text-left">
                <div className="text-[12px] font-semibold mb-1 text-color-text1">
                  Sweep report
                </div>
                <div className="max-h-[220px] overflow-y-auto rounded-[6px] border border-color-border1">
                  {sweepResults.items.map((item) => (
                    <div
                      key={item.address}
                      className="flex items-start justify-between gap-2 px-2 py-1 border-b border-color-border1 last:border-0 text-[12px]"
                    >
                      <span className="truncate">{item.address}</span>
                      <span
                        className={
                          item.status === "signed" || item.status === "ok"
                            ? "text-color-text2 shrink-0"
                            : "text-red-500 shrink-0"
                        }
                      >
                        {item.status}
                        {item.reason ? `: ${item.reason}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
                {sweepResults.error && (
                  <div className="text-red-500 text-[12px] mt-1">
                    {sweepResults.error}
                  </div>
                )}
                {sweepResults.txHash && (
                  <div className="text-color-text2 text-[12px] mt-1 break-all">
                    tx: {sweepResults.txHash}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
