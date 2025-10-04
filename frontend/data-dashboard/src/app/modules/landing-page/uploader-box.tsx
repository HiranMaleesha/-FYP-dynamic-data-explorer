'use client'
import { useState, useRef } from 'react';
import { Button } from '../common/button';
import apiClient from '../../../lib/api-client';

export default function UploaderBox() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError('');
    try {
      const result = await apiClient.uploadFile(selectedFile);
      console.log('Upload successful', result);
      // Optionally, reset selectedFile or show success message
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

    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a CSV or Excel file.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setError('');
    handleUpload();  // Upload automatically after selecting a valid file
  };

  return (
    <div className="mx-auto mt-8 flex w-full flex-col gap-2 lg:mt-18 lg:w-[800px]">
      <div
        className="hover:bg-bg-blue/50 border-grayscale-800 hover:border-primary-700 relative flex aspect-[1.4] cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed md:aspect-[1.8]"
        data-testid="uploader-box"
      >
        <Button
          id="upload-button"
          data-testid="uploader-button"
          className="xs:py-8 text-lg font-semibold md:text-xl bg-blue-400 text-white"
          onClick={handleButtonClick}
        >
          Upload CSV or Excel File
          {/* {isProcessing && <Spinner />} */}
        </Button>

        <div
          className="text-grayscale-700 font-body-regular text-sm md:text-base"
          data-testid="drag-and-drop-instruction"
        >
          {selectedFile ? `Selected: ${selectedFile.name}` : 'Click to select a file'}
        </div>
        {error && <div className="text-red-500 text-sm">{error}</div>}
      </div>
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv,.xlsx,.xls"
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