// FlashBack Labs API Service
const API_BASE_URL = 'https://flashback.inc:9000';

// Refresh token from environment
const REFRESH_TOKEN = 'a02054c6-48d2-4fa1-90d1-74cef9020457503efd5b-bfd3-43a3-8500-1e9543aed062';

interface SendOtpRequest {
  phoneNumber: string;
}

interface SendOtpResponse {
  success: boolean;
  message: string;
  // Add other response fields as needed
}

interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
  login_platform: string;
}

interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token?: string; // JWT token for subsequent requests
  accessToken?: string; // Alternative token field name
  refreshToken?: string;
  // Add other response fields as needed
}

interface UploadSelfieResponse {
  success: boolean;
  message: string;
  imageUrl?: string;
  // Add other response fields as needed
}


class FlashBackApiService {
  private getHeaders(contentType: string = 'application/json', authToken?: string): HeadersInit {
    const headers: HeadersInit = {};
    
    // Only set Content-Type for non-multipart requests
    if (contentType !== 'multipart/form-data') {
      headers['Content-Type'] = contentType;
    }
    
    headers['Cookie'] = `refreshToken=${REFRESH_TOKEN}`;
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    return headers;
  }

  private async makeRequest<T>(
    endpoint: string,
    method: string,
    body?: any,
    contentType: string = 'application/json',
    authToken?: string
  ): Promise<T> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = this.getHeaders(contentType, authToken);
      
      const requestOptions: RequestInit = {
        method,
        headers,
      };

      if (body) {
        if (contentType === 'application/json') {
          requestOptions.body = JSON.stringify(body);
        } else {
          requestOptions.body = body;
        }
      }

      console.log(`Making ${method} request to: ${url}`);
      console.log('Request body:', body);

      const response = await fetch(url, requestOptions);
      const responseText = await response.text();
      
      console.log('Response status:', response.status);
      console.log('Response text:', responseText);

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        // If response is not JSON, treat as error message
        data = { success: false, message: responseText };
      }

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${responseText}`);
      }

      // Ensure response has success field for consistency
      if (data.success === undefined) {
        data.success = response.ok;
      }

      return data as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
    const requestBody: SendOtpRequest = {
      phoneNumber,
    };

    return this.makeRequest<SendOtpResponse>('/api/mobile/sendOTP', 'POST', requestBody);
  }

  async verifyOtp(phoneNumber: string, otp: string): Promise<VerifyOtpResponse> {
    const requestBody: VerifyOtpRequest = {
      phoneNumber,
      otp,
      login_platform: 'MobileApp',
    };

    return this.makeRequest<VerifyOtpResponse>('/api/mobile/verifyOTP', 'POST', requestBody);
  }

  async uploadSelfie(imageFile: File | Blob, username: string, authToken: string): Promise<UploadSelfieResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('username', username);

    return this.makeRequest<UploadSelfieResponse>('/api/mobile/uploadUserPortrait', 'POST', formData, 'multipart/form-data', authToken);
  }

}

export const flashBackApiService = new FlashBackApiService();
export type { 
  SendOtpRequest, 
  SendOtpResponse, 
  VerifyOtpRequest, 
  VerifyOtpResponse, 
  UploadSelfieResponse
};
