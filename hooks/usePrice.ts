import { UseQueryResult, useQuery } from '@tanstack/react-query';
import { getTokenPriceUrl } from 'utils/configUtils';

export function usePrice() {
  const tokenPriceResult: UseQueryResult<number> = useQuery({
    queryKey: ['GetTokenPrice', getTokenPriceUrl()],
    staleTime: 120000,
    queryFn: async () => {
      try {
        const response = await fetch(getTokenPriceUrl(), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const resJson = await response.json();
        if (resJson) {
          const { usd } = resJson['pulsechain'];
          // console.log({ usd });
          return usd;
        }
      } catch (err: any) {}

      return 0;
    },
  });

  return {
    tokenPrice: tokenPriceResult.data,
    lsdEthPrice: 0,
  };
}
