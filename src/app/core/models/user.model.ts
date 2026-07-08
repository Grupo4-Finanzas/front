export interface User {
  id: number;
  documentNumber: string;
  firstName: string;
  fullName: string;
  email: string;
  role: 'USER' | 'ADMIN' | 'client' | 'admin';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  documentNumber: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedPrivacy: boolean;
}
