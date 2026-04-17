import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

const apiCall = async (method, endpoint, data = null) => {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: { Authorization: `Bearer ${authToken}` }
  };

  if (data) {
    config.data = data;
    config.headers['Content-Type'] = 'application/json';
  }

  return axios(config);
};

async function testVoucherGeneration() {
  try {
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@eduflow.com',
      password: 'admin123'
    });
    authToken = loginResponse.data.token;
    console.log('Login successful');

    // Check existing vouchers first
    console.log('Checking existing vouchers for campus 67...');
    const existingResponse = await apiCall('GET', '/students?campusId=67');
    console.log(`Found ${existingResponse.data.length} students in campus 67`);

    // Try to generate vouchers for campus 67 (Baldia Campus from previous test)
    console.log('Testing voucher generation for campus 67...');
    try {
      const response = await apiCall('POST', '/fees/generate-vouchers', {
        campusId: 67,
        month: '2024-09'
      });
      console.log('Success:', response.data);
    } catch (error) {
      console.log('Voucher generation failed (expected due to timeout):', error.response?.data?.message || error.message);

      // Wait a bit and check if vouchers were actually created
      console.log('Waiting 5 seconds and checking if vouchers were created...');
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if vouchers exist by trying to get ledger for a student
      try {
        const ledgerResponse = await apiCall('GET', '/fees/ledger/1'); // Try student ID 1
        console.log('Ledger check result: Found ledger entries');
      } catch (ledgerError) {
        console.log('Ledger check: No ledger found (vouchers may not have been created)');
      }
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testVoucherGeneration();