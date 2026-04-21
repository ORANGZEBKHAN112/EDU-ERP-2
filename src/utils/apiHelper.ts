import { normalizeResponse, normalizeArrayResponse, StandardResponse } from './apiResponseNormalizer';

/**
 * Unwrap API response to extract data
 * Handles both new standardized format { success, data } and legacy formats
 * @deprecated Use normalizeResponse and extractData instead
 */
export const unwrap = (res: any) => {
  // Handle standardized response format: { success, data }
  if (res?.success !== undefined && res?.data !== undefined) {
    return res.data;
  }
  
  // Handle legacy formats: nested data, items array, direct objects/arrays
  const data = res?.data?.data ?? res?.data ?? res;
  return data;
};

/**
 * Ensure unwrapped response is an array
 * @deprecated Use normalizeArrayResponse instead
 */
export const unwrapArray = (res: any): any[] => {
  const data = unwrap(res);
  return Array.isArray(data) ? data : (data ? [data] : []);
};

/**
 * Safe data extraction with error handling
 * Returns data or throws error if response indicates failure
 */
export const extractData = <T = any>(response: StandardResponse<T>): T => {
  if (!response.success) {
    throw new Error(response.message || 'API request failed');
  }
  return response.data as T;
};

/**
 * Safe array extraction that always returns an array
 */
export const extractArrayData = <T = any>(response: StandardResponse<T[]>): T[] => {
  if (!response.success) {
    throw new Error(response.message || 'API request failed');
  }
  return Array.isArray(response.data) ? response.data : (response.data ? [response.data as any] : []);
};
