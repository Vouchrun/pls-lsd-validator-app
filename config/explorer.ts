import { getExplorerUrl, getValidatorExplorerUrl, isDev } from "./env";

export function getEtherScanTxUrl(txHash: string | undefined) {
  return `${getExplorerUrl()}/tx/${txHash}`;
}

export function getEtherScanAccountUrl(account: string) {
  return `${getExplorerUrl()}/address/${account}`;
}

export function getEtherScanErc20TxUrl(address: any) {
  return `${getExplorerUrl()}/address/${address}#tokentxns`;
}

// export function getValidatorProfileUrl(address: string) {
//   return `${getValidatorExplorerUrl()}/address/${address}`;
// }

export function getValidatorProfileUrl(address: string) {
  return `${getValidatorExplorerUrl()}/validators/initiated-deposits?q=${address}`;
}
