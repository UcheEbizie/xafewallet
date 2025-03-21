import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, File, X, Camera } from 'lucide-react';
import PDFPreview from './PDFPreview';

const FileUploadHandler = ({ onFileUploaded }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const allowedFileTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png'
  ];

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const handleCameraCapture = (event) => {
    const file = event.target.files?.[0];
    processFile(file);
  };

  const processFile = (file) => {
    setUploadError('');
    
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    
    if (!file) return;

    if (!allowedFileTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload PDF, JPEG, or PNG files.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    simulateUpload(file);
  };

  const simulateUpload = (file) => {
    setUploadProgress(0);
    const totalSteps = 10;
    let currentStep = 0;

    const uploadInterval = setInterval(() => {
      currentStep++;
      setUploadProgress((currentStep / totalSteps) * 100);

      if (currentStep === totalSteps) {
        clearInterval(uploadInterval);
        onFileUploaded(file);
      }
    }, 200);
  };

  const cancelUpload = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadError('');
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        {!selectedFile ? (
          <div className="space-y-4">
            <div className="text-center">
              <input
                type="file"
                id="file-upload"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png"
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer inline-flex flex-col items-center"
              >
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">
                  Drop your file here or click to browse
                </span>
              </label>
            </div>

            <div className="text-center">
              <div className="relative inline-block">
                <input
                  type="file"
                  id="camera-capture"
                  ref={cameraInputRef}
                  className="hidden"
                  onChange={handleCameraCapture}
                  accept="image/*"
                  capture="environment"
                />
                <label
                  htmlFor="camera-capture"
                  className="cursor-pointer inline-flex flex-col items-center"
                >
                  <Camera className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">
                    Take a photo
                  </span>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedFile.type.startsWith('image/') && previewUrl && (
              <div className="relative w-full aspect-video">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="rounded-lg object-contain w-full h-full"
                />
              </div>
            )}
            {selectedFile.type === 'application/pdf' && previewUrl && (
              <PDFPreview file={previewUrl} />
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <File className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{selectedFile.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelUpload}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}
      </div>

      {uploadError && (
        <Alert variant="destructive">
          <AlertDescription>{uploadError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default FileUploadHandler;