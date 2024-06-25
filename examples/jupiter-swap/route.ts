import {
  createJupiterApiClient,
  QuoteGetRequest,
  SwapPostRequest,
} from '@jup-ag/api';

export interface JupiterTokenPriceData {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
}

interface JupiterPriceApiResponse {
  data: Record<string, JupiterTokenPriceData>;
  timeTaken: number;
}

export interface JupiterTokenMetadata {
  address: string;
  chainId: number;
  decimals: number;
  name?: string;
  symbol?: string;
  logoURI: string;
  tags: string[];
}

export const createJupiterApi = () => {
  const jupiterApi = createJupiterApiClient();

  const getTokenPricesInUsdc = async (tokenIds: string[]) => {
    if (tokenIds.length === 0) {
      return {};
    }
    const url = `https://price.jup.ag/v4/price?ids=${tokenIds.join(
      ',',
    )}&vsToken=USDC`;
    const response = await fetch(url);
    const parsedResponse = (await response.json()) as JupiterPriceApiResponse;
    return parsedResponse.data;
  };

  const getTokenPriceInSol = async (tokenIds: string[]) => {
    if (tokenIds.length === 0) {
      return {};
    }
    const url = `https://price.jup.ag/v4/price?ids=${tokenIds.join(
      ',',
    )}&vsToken=SOL`;
    const response = await fetch(url);
    const parsedResponse = (await response.json()) as JupiterPriceApiResponse;
    return parsedResponse.data;
  };

  const quoteGet = async (request: QuoteGetRequest) => {
    return await jupiterApi.quoteGet(request);
  };

  const swapPost = async (request: SwapPostRequest) => {
    return await jupiterApi.swapPost(request);
  };

  const getTokenList = async (): Promise<JupiterTokenMetadata[]> => {
    try {
      const response = await fetch('https://token.jup.ag/all');

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const getStrictList = async (): Promise<JupiterTokenMetadata[]> => {
    try {
      const response = await fetch('https://token.jup.ag/strict');

      if (!response.ok) {
        return [];
      }

      return await response.json();
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const lookupToken = async (
    token: string | null,
  ): Promise<JupiterTokenMetadata | null> => {
    if (!token) {
      return null;
    }
    const tokenLowercase = token.toLowerCase().trim();
    const jupiterTokenMetadata = await getStrictList();

    const jupTokenMetaDatum = jupiterTokenMetadata.find(
      (token) =>
        token.symbol?.toLowerCase() === tokenLowercase ||
        token.address?.toLowerCase() === tokenLowercase,
    );

    return jupTokenMetaDatum ?? null;
  };

  const swapSolForFml = async (amountInSol: number) => {
    const fmlAddress = '5Z7Bmo3RRiMEuqTaJtqDaRmLonWApLB7pNY2NdtACmNB';

    // Get quote for swapping SOL to $FML
    const quoteRequest: QuoteGetRequest = {
      inputMint: 'So11111111111111111111111111111111111111112', // SOL mint address
      outputMint: fmlAddress, // $FML mint address
      amount: amountInSol * 1e9, // Convert SOL to lamports
      slippage: 0.5, // Slippage tolerance in percentage
    };

    const quote = await quoteGet(quoteRequest);

    if (quote) {
      const swapRequest: SwapPostRequest = {
        route: quote.data[0].route,
        userPublicKey: 'YourPublicKey', // Replace with the user's public key
      };

      const swapResponse = await swapPost(swapRequest);
      return swapResponse;
    } else {
      throw new Error('Failed to get a quote for the swap.');
    }
  };

  return {
    getTokenPricesInUsdc,
    getTokenPriceInSol,
    quoteGet,
    swapPost,
    lookupToken,
    swapSolForFml,
  };
};

const jupiterApi = createJupiterApi();

export default jupiterApi;

