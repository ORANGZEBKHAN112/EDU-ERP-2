/**
 * API Response Normalizer
 * Standardizes API responses to a consistent format and handles nested payloads
 */

export interface StandardResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Normalize API response to a consistent format
 * Handles legacy responses: array, object with data property, nested items array
 * Standardizes to: { success, data, message? }
 */
export function normalizeResponse<T = any>(response: any): StandardResponse<T> {
  // Handle null/undefined
  if (!response) {
    return { success: true, data: null };
  }

  // Already in standard format
  if (response.success !== undefined) {
    return response;
  }

  // If response has 'data' property (partial standard format)
  if (response.data !== undefined) {
    return {
      success: true,
      data: response.data,
      message: response.message
    };
  }

  // If response has nested 'items' array (legacy format)
  if (response.items !== undefined && Array.isArray(response.items)) {
    return {
      success: true,
      data: response.items,
      message: response.message
    };
  }

  // If response is an array (legacy format)
  if (Array.isArray(response)) {
    return {
      success: true,
      data: response
    };
  }

  // If response is an object without success/data (assume it's the data)
  return {
    success: true,
    data: response
  };
}

/**
 * Extract data from normalized response
 * Returns data or throws error if response indicates failure
 */
export function extractData<T = any>(response: StandardResponse<T>): T {
  if (!response.success) {
    throw new Error(response.message || 'Request failed');
  }
  return response.data;
}

/**
 * Normalize array responses
 * Ensures result is always an array
 */
export function normalizeArrayResponse<T = any>(response: any): T[] {
  const normalized = normalizeResponse<T[]>(response);
  const data = normalized.data;
  
  if (Array.isArray(data)) {
    return data;
  }
  
  if (data === null || data === undefined) {
    return [];
  }
  
  return [data as T];
}

/**
 * Create a successful response
 */
export function successResponse<T = any>(data: T, message?: string): StandardResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message })
  };
}

/**
 * Create an error response
 */
export function errorResponse(message: string): StandardResponse {
  return {
    success: false,
    message
  };
}
