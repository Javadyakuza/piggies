// hooks/useApi.ts
import { useEffect, useState, useCallback } from "react";
import axios, { Method } from "axios";

type UseApiOptions<TParams = any> = {
  url: string;
  method?: Method;
  auto?: boolean;
  params?: TParams;
  enabled?: boolean;
};

export function useApi<TResponse = any, TParams = any>({
  url,
  method = "GET",
  auto = true,
  params,
  enabled = true,
}: UseApiOptions<TParams>) {
  const [data, setData] = useState<TResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchData = useCallback(
    async (overrideParams?: TParams) => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios({
          url,
          method,
          data: method !== "GET" ? overrideParams ?? params : undefined,
          params: method === "GET" ? overrideParams ?? params : undefined,
        });
        setData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [url, method, params]
  );

  useEffect(() => {
    if (auto && enabled) {
      fetchData();
    }
  }, [fetchData, auto, enabled]);

  return { data, error, loading, refetch: fetchData };
}
