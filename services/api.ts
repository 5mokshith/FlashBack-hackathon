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
  private async getHeaders(contentType: string = 'application/json', authToken?: string): Promise<HeadersInit> {
    const headers: HeadersInit = {};
    
    // Only set Content-Type for non-multipart requests
    if (contentType !== 'multipart/form-data') {
      headers['Content-Type'] = contentType;
    }
    
    // Try to get stored refresh token, fallback to hardcoded one
    let refreshToken = REFRESH_TOKEN;
    try {
      const { SecureStorage } = await import('../utils/storage');
      const storedRefreshToken = await SecureStorage.getRefreshToken();
      if (storedRefreshToken) {
        refreshToken = storedRefreshToken;
      }
    } catch (error) {
      console.log('Using fallback refresh token');
    }
    
    headers['Cookie'] = `refreshToken=${refreshToken}`;
    
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
      const headers = await this.getHeaders(contentType, authToken);
      
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
      console.log('Request headers:', headers);
      if (contentType === 'application/json') {
        console.log('Request body:', body);
      } else {
        console.log('Request body type:', typeof body);
      }

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
    } catch (error: any) {
      console.error('API request failed:', error);
      
      // Handle specific network errors
      if (error.message?.includes('Network request failed')) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Request timed out. Please try again.');
      } else if (error.message?.includes('CORS')) {
        throw new Error('Server configuration issue. Please contact support.');
      }
      
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
    
    // For React Native, we need to handle the file differently
    if (imageFile instanceof Blob) {
      formData.append('image', imageFile as any, 'selfie.jpg');
    } else {
      formData.append('image', imageFile);
    }
    
    formData.append('username', username);

    console.log('FormData created with username:', username);
    console.log('Image file type:', typeof imageFile);
    console.log('Image file size:', imageFile.size);

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
