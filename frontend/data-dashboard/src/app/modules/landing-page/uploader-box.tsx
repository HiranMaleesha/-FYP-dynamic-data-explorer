'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../common/button';
import { Upload, FileText } from 'lucide-react';
import apiClient from '../../../lib/api-client';

export default function UploaderBox() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange({ target: { files } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const simulateProgress = async () => {
    const steps = [
      { message: 'Starting file upload', progress: 10 },
      { message: 'File read successfully', progress: 20 },
      { message: 'Uploading to S3', progress: 40 },
      { message: 'S3 upload completed', progress: 60 },
      { message: 'Processing data', progress: 70 },
      { message: 'Data transformation completed', progress: 80 },
      { message: 'Computing insights', progress: 90 },
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay between steps
      setProgress(step.progress);
      setMessage(step.message);
    }
  };

  const handleUpload = async (fileToUpload?: File) => {
    const file = fileToUpload || selectedFile;
    if (!file) return;

    setIsUploading(true);
    setError('');
    setProgress(0);
    setMessage('');

    try {
      // Start progress simulation
      const progressPromise = simulateProgress();

      // Make the actual upload request
      const result = await apiClient.uploadFile(file);

      // Wait for progress to complete
      await progressPromise;

      console.log('Upload successful', result);

      // Store the summary data in localStorage for the dashboard
      if (result.insights) {
        localStorage.setItem('insightsData', JSON.stringify(result.insights));
      }

      // Store S3 filename for chat functionality
      if (result.filename) {
        localStorage.setItem('s3Filename', result.filename);
      }

      // Navigate to dashboard after successful upload
      router.push('/dashboard');
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'text/csv',
      'text/plain',
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
    ];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a CSV or Excel file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError('');
    handleUpload(file); // Pass the file directly
  };

  return (
    <div className='mx-auto mt-8 flex w-full flex-col gap-2 lg:mt-18 lg:w-[800px]'>
      <div
        className={`hover:bg-blue-50 border-gray-300 hover:border-blue-500 relative flex aspect-[1.4] cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors md:aspect-[1.8] ${
          isDragOver ? 'bg-blue-50 border-blue-500' : ''
        }`}
        data-testid='uploader-box'
        onClick={handleButtonClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className='flex flex-col items-center gap-4'>
          <Upload className='h-12 w-12 text-blue-500' />
          <div className='text-center'>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Upload your data file
            </h3>
            <p className='text-gray-600 text-sm mb-4'>
              Supports CSV and Excel files up to 10MB
            </p>
            <p className='text-gray-500 text-xs mb-4'>
              Drag and drop or click to select your file
            </p>
            <Button
              variant="cta"
              id='upload-button'
              className='w-48 h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300'
              data-testid='uploader-button'
              onClick={(e) => {
                e.stopPropagation();
                handleButtonClick();
              }}
            >
              Choose File
            </Button>
          </div>
        </div>

        {isUploading && (
          <div className='w-full mt-4'>
            <div className='bg-gray-200 rounded-full h-3 mb-2'>
              <div className='bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out' style={{ width: `${progress}%` }}></div>
            </div>
            <div className='flex justify-between items-center'>
              <p className='text-sm text-gray-600'>{message || 'Uploading and processing your file...'}</p>
              <span className='text-sm font-medium text-gray-700'>{progress}%</span>
            </div>
          </div>
        )}

        {selectedFile && !isUploading && (
          <div className='flex items-center gap-2 mt-4 p-3 bg-green-50 border border-green-200 rounded-md'>
            <FileText className='h-5 w-5 text-green-600' />
            <span className='text-sm text-green-800'>{selectedFile.name}</span>
          </div>
        )}

        {error && <div className='text-red-500 text-sm mt-2 text-center'>{error}</div>}
      </div>
      <input
        type='file'
        ref={fileInputRef}
        accept='.csv,.xlsx,.xls'
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      {/* {selectedFile && (
        <Button
          onClick={handleUpload}
          disabled={isUploading}
          className="mt-4 bg-green-500 text-white"
        >
          {isUploading ? 'Uploading...' : 'Upload File'}
        </Button>
      )} */}
      {/* <SampleImages /> */}
    </div>
  );
}
