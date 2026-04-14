export interface IRecoveryService {
  detectInconsistencies(): Promise<void>;
  processQueue(): Promise<void>;
}
