import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = 'http://localhost:3001/api';

interface LoginResponse {
  token: string;
  user: {
    id: number;
    fullName: string;
    email: string;
    roles: string[];
    campusIds: number[];
    schoolId: number;
  };
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

let token = '';
let schoolId = 0;
let campusIds: number[] = [];
let userId = 0;

async function testLogin() {
  console.log('\n📡 TEST 1: LOGIN');
  console.log('========================================');
  
  const credentials = {
    email: 'admin@eduflow.com',
    password: 'password'
  };
  
  try {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    const data = response.data;
    console.log('✅ Login successful');
    console.log('   Token:', data.token.substring(0, 20) + '...');
    console.log('   User ID:', data.user.id);
    console.log('   User Email:', data.user.email);
    console.log('   User Roles:', data.user.roles);
    console.log('   School ID:', data.user.schoolId);
    console.log('   Campus IDs:', data.user.campusIds);
    
    token = data.token;
    schoolId = data.user.schoolId;
    campusIds = data.user.campusIds;
    userId = data.user.id;
    
    // Set auth header for subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return true;
  } catch (error: any) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    console.error('   Status:', error.response?.status);
    console.error('   Full error:', error.response?.data);
    return false;
  }
}

async function testCampusesAPI() {
  console.log('\n📡 TEST 2: GET CAMPUSES');
  console.log('========================================');
  
  try {
    const response = await api.get('/campuses');
    const data = response.data;
    console.log('✅ Campuses API successful');
    console.log('   Response type:', typeof data);
    console.log('   Response structure:', data?.data ? 'Has .data property' : 'Direct array/object');
    
    const campuses = Array.isArray(data) ? data : (data?.data || []);
    console.log('   Total campuses:', campuses.length);
    if (campuses.length > 0) {
      console.log('   First campus:', JSON.stringify(campuses[0], null, 2));
    }
    return true;
  } catch (error: any) {
    console.error('❌ Campuses API failed:', error.response?.data?.message || error.message);
    console.error('   Status:', error.response?.status);
    return false;
  }
}

async function testStudentsAPI() {
  console.log('\n📡 TEST 3: GET STUDENTS');
  console.log('========================================');
  
  try {
    const params = new URLSearchParams();
    if (schoolId) params.append('schoolId', schoolId.toString());
    if (campusIds.length > 0) params.append('campusIds', campusIds.join(','));
    
    console.log('   Query params:', `schoolId=${schoolId}, campusIds=${campusIds.join(',')}`);
    
    const response = await api.get('/students', { params: Object.fromEntries(params) });
    const data = response.data;
    console.log('✅ Students API successful');
    console.log('   Response type:', typeof data);
    console.log('   Response structure:', data?.data ? 'Has .data property' : 'Direct array/object');
    
    const students = Array.isArray(data) ? data : (data?.data || []);
    console.log('   Total students:', students.length);
    if (students.length > 0) {
      console.log('   First student:', JSON.stringify(students[0], null, 2));
    }
    return true;
  } catch (error: any) {
    console.error('❌ Students API failed:', error.response?.data?.message || error.message);
    console.error('   Status:', error.response?.status);
    console.error('   Full response:', error.response?.data);
    return false;
  }
}

async function testClassesAPI() {
  console.log('\n📡 TEST 4: GET CLASSES');
  console.log('========================================');
  
  if (campusIds.length === 0) {
    console.warn('⚠️  Skipping: No campuses assigned to user');
    return false;
  }
  
  const campusId = campusIds[0];
  try {
    console.log(`   Campus ID: ${campusId}`);
    const response = await api.get(`/classes/${campusId}`, { 
      params: { schoolId, campusId } 
    });
    const data = response.data;
    console.log('✅ Classes API successful');
    console.log('   Response type:', typeof data);
    console.log('   Response structure:', data?.data ? 'Has .data property' : 'Direct array/object');
    
    const classes = Array.isArray(data) ? data : (data?.data || []);
    console.log('   Total classes:', classes.length);
    if (classes.length > 0) {
      console.log('   First class:', JSON.stringify(classes[0], null, 2));
    }
    return true;
  } catch (error: any) {
    console.error('❌ Classes API failed:', error.response?.data?.message || error.message);
    console.error('   Status:', error.response?.status);
    return false;
  }
}

async function testPaymentsAPI() {
  console.log('\n📡 TEST 5: GET PAYMENTS');
  console.log('========================================');
  
  try {
    const params = new URLSearchParams();
    if (schoolId) params.append('schoolId', schoolId.toString());
    if (campusIds.length > 0) params.append('campusIds', campusIds.join(','));
    
    console.log('   Query params:', `schoolId=${schoolId}, campusIds=${campusIds.join(',')}`);
    
    const response = await api.get('/reports/payments', { params: Object.fromEntries(params) });
    const data = response.data;
    console.log('✅ Payments API successful');
    console.log('   Response type:', typeof data);
    console.log('   Response structure:', data?.data ? 'Has .data property' : 'Direct array/object');
    
    const payments = Array.isArray(data) ? data : (data?.data || []);
    console.log('   Total payments:', payments.length);
    if (payments.length > 0) {
      console.log('   First payment:', JSON.stringify(payments[0], null, 2));
    }
    return true;
  } catch (error: any) {
    console.error('❌ Payments API failed:', error.response?.data?.message || error.message);
    console.error('   Status:', error.response?.status);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 FRONTEND API CALL TEST SUITE');
  console.log('=====================================');
  console.log('Base URL:', API_BASE_URL);
  console.log('Testing at:', new Date().toISOString());
  
  const results: { [key: string]: boolean } = {};
  
  results['Login'] = await testLogin();
  
  if (results['Login']) {
    results['Campuses'] = await testCampusesAPI();
    results['Students'] = await testStudentsAPI();
    results['Classes'] = await testClassesAPI();
    results['Payments'] = await testPaymentsAPI();
  } else {
    console.error('\n❌ Login failed - cannot proceed with other tests');
  }
  
  console.log('\n📊 TEST SUMMARY');
  console.log('=====================================');
  Object.entries(results).forEach(([name, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  
  const passCount = Object.values(results).filter(v => v).length;
  const totalCount = Object.values(results).length;
  console.log(`\n${passCount}/${totalCount} tests passed`);
}

runAllTests().catch(console.error);
