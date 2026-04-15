import api from './axios';

export const ledgerApi = {
  getStudentLedger: async (studentId: number) => {
    const response = await api.get(`/ledger/student/${studentId}`);
    return response.data;
  }
};
