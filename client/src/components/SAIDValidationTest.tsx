import React, { useState } from 'react';
import { validateAndExtractSAID } from '@/utils/sa-id-validation';

export function SAIDValidationTest() {
  const [idNumber, setIdNumber] = useState('');
  const [validationResult, setValidationResult] = useState<any>(null);

  const testValidation = () => {
    console.log('🔧 SA ID Test - Button clicked');
    console.log('🔧 SA ID Test - Testing SA ID:', idNumber);
    
    try {
      const result = validateAndExtractSAID(idNumber);
      console.log('🔧 SA ID Test - Validation result:', result);
      setValidationResult(result);
    } catch (error) {
      console.error('🔧 SA ID Test - Validation error:', error);
      setValidationResult({ 
        isValid: false, 
        errors: ['Validation function error: ' + error.message] 
      });
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">SA ID Validation Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            SA ID Number:
          </label>
          <input
            type="text"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="Enter SA ID number"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <button
          onClick={testValidation}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
        >
          Test Validation
        </button>
        
        {validationResult && (
          <div className="mt-4 p-3 border rounded-md">
            <h3 className="font-medium mb-2">Validation Result:</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Valid:</strong> {validationResult.isValid ? '✅ Yes' : '❌ No'}</p>
              
              {validationResult.isValid && validationResult.data && (
                <>
                  <p><strong>Age:</strong> {validationResult.data.age}</p>
                  <p><strong>Gender:</strong> {validationResult.data.gender}</p>
                  <p><strong>Date of Birth:</strong> {validationResult.data.dateOfBirth}</p>
                </>
              )}
              
              {validationResult.errors && validationResult.errors.length > 0 && (
                <div>
                  <strong>Errors:</strong>
                  <ul className="list-disc list-inside">
                    {validationResult.errors.map((error: string, index: number) => (
                      <li key={index} className="text-red-600">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500">
          <p>Test with: 7807215422081</p>
          <p>Should show: Age 47, Male, DOB 1978-07-21</p>
        </div>
      </div>
    </div>
  );
}

export default SAIDValidationTest;