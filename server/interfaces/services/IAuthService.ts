export interface IAuthService {
  login(email: string, password: string): Promise<{ token: string; user: any }>;
  verifyToken(token: string): any;
}
