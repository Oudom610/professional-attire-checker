import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { Camera, Upload, RefreshCw, Info, X, AlertCircle, Shield, XCircle } from 'lucide-react';

const PrivacyBanner = ({ onDismiss }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="mb-4 bg-green-50 border border-green-200 rounded-lg shadow-md overflow-hidden">
      <div className="flex items-start justify-between p-4 gap-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-green-800 text-sm leading-relaxed">
            All images are processed locally in your browser and are never uploaded or stored! Data is automatically cleared when you refresh the page.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-green-600 hover:text-green-800 transition-colors p-1.5 rounded-full hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          aria-label="Dismiss privacy message"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const InfoModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-bold mb-4">About Professional Attire Checker</h2>
        
        <div className="space-y-4">
          <section>
            <h3 className="text-lg font-semibold mb-2">What is this?</h3>
            <p className="text-gray-700">
              The Professional Attire Checker is an AI-powered tool that helps remote workers maintain appropriate dress codes. 
              It automatically classifies outfits as business professional, business casual, or too casual, providing instant feedback 
              on workplace attire.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">Who is it for?</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>New remote employees seeking guidance on video call attire</li>
              <li>Global teams with diverse interpretations of professional dress codes</li>
              <li>Anyone wanting quick, objective feedback on their workplace attire</li>
            </ul>
          </section>

          <section className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">⚠️ Important Note</h3>
            <p className="text-gray-700">
              This tool was only trained on common business attire 
              (suits, blazers, button-up shirts, and casual wear) and may not accurately classify traditional, cultural, or clothing that is never intended for workplace such as swimwear, pajamas etc.
            </p>
          </section>

          <section className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">📸 Tips for Best Results</h3>
            <ul className="list-disc pl-5 text-gray-700 space-y-2">
              <li>Avoid distracting background</li>
              <li>Ensure good lighting for clear visibility</li>
              <li>Avoid showing only your face and shoulders</li>
              <li>Position the camera to capture your full upper body</li>
              <li>Stand or sit at a distance that shows your outfit clearly</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold mb-2">How to Use</h3>
            <ol className="list-decimal pl-5 text-gray-700 space-y-2">
              <li>Click "Upload Photo" to select an image or "Use Camera" to take a photo</li>
              <li>Position yourself following the tips above</li>
              <li>If using the camera, click "Capture Photo" when ready</li>
              <li>Wait for the AI to analyze your attire</li>
              <li>Review the feedback and adjust your outfit if needed</li>
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
};

const ErrorAlert = ({ message }) => (
  <div className="flex items-center gap-2 p-4 mt-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
    <AlertCircle className="w-5 h-5" />
    <p>{message}</p>
  </div>
);

const WebcamPreview = forwardRef(({ onStreamReady, onStreamEnd }, ref) => {
  const streamRef = useRef(null);
  
  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        if (mounted && ref.current) {
          ref.current.srcObject = stream;
          streamRef.current = stream;
          onStreamReady(stream);
        } else {
          stream.getTracks().forEach(track => {
            track.enabled = false;
            track.stop();
          });
        }
      } catch (err) {
        console.error('Camera error:', err);
      }
    };

    startCamera();

    // Enhanced cleanup function
    return () => {
      mounted = false;
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => {
          track.enabled = false; 
          track.stop();          
        });
        
        if (ref.current) {
          ref.current.srcObject = null;
        }
        
        streamRef.current = null;
        if (onStreamEnd) {
          onStreamEnd();
        }
      }
    };
  }, [ref, onStreamReady, onStreamEnd]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className="w-full h-full object-cover transform -scale-x-100 rounded-lg"
    />
  );
});

WebcamPreview.displayName = 'WebcamPreview';

const AttireChecker = () => {
  const [imageURL, setImageURL] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const modelRef = useRef(null);
  const activeStreamRef = useRef(null);
  const [isModelLoading, setIsModelLoading] = useState(true);

  useEffect(() => {
    loadModel();
    return () => {
      stopCamera();
    };
  }, []);

  const loadModel = async () => {
    try {
      const URL = "https://teachablemachine.withgoogle.com/models/hndWZWfiD/";
      const modelURL = URL + "model.json";
      const metadataURL = URL + "metadata.json";
      
      if (!window.tmImage) {
        throw new Error('Teachable Machine library not loaded');
      }

      modelRef.current = await window.tmImage.load(modelURL, metadataURL);
      setIsModelLoading(false);
    } catch (error) {
      console.error('Error loading model:', error);
      setError("Failed to load model. Please refresh the page to try again.");
      setIsModelLoading(false);
    }
  };

  const handleStreamReady = (stream) => {
    activeStreamRef.current = stream;
  };

  const handleStreamEnd = () => {
    activeStreamRef.current = null;
  };

  const handleCameraCapture = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  const startCamera = () => {
    setIsCameraActive(true);
    setImageURL(null);
    setPrediction(null);
    setError(null);
  };

  const stopCamera = () => {
    setIsCameraActive(false);
    
    if (activeStreamRef.current) {
      const tracks = activeStreamRef.current.getTracks();
      tracks.forEach(track => {
        track.enabled = false;  
        track.stop();          
      });
      activeStreamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.load();
        }
      }, 0);
    }
  };

  const captureImage = async () => {
    if (!videoRef.current || !modelRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      
      // Mirror the image
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL('image/jpeg');
      setImageURL(imageData);

      const img = new Image();
      img.src = imageData;
      await img.decode();

      const predictions = await modelRef.current.predict(img);
      const topPrediction = predictions.sort((a, b) => b.probability - a.probability)[0];
      setPrediction(topPrediction);

      stopCamera();
    } catch (err) {
      console.error('Error capturing image:', err);
      setError("Error capturing image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);
      setPrediction(null);
      
      const url = URL.createObjectURL(file);
      setImageURL(url);

      const img = new Image();
      img.src = url;
      await img.decode();

      if (!modelRef.current) {
        throw new Error('Model not loaded');
      }
      
      const predictions = await modelRef.current.predict(img);
      const sortedPredictions = predictions.sort((a, b) => b.probability - a.probability);
      setPrediction(sortedPredictions[0]);

    } catch (err) {
      console.error('Error processing image:', err);
      setError("Error processing image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Professional Attire Checker</h1>
            <button 
              onClick={() => setIsInfoOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Info className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        <PrivacyBanner />

        <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />
        
        {/* Main Content Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {isModelLoading ? (
            <div className="text-center p-8">
              <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading model...</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => fileInputRef.current.click()}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  disabled={isCameraActive}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Photo
                </button>
                <button
                  onClick={handleCameraCapture}
                  className={`flex items-center px-6 py-3 ${
                    isCameraActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  } text-white rounded-lg transition-colors shadow-sm`}
                >
                  <Camera className="w-5 h-5 mr-2" />
                  {isCameraActive ? 'Stop Camera' : 'Use Camera'}
                </button>
              </div>

              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />

              {cameraError && <ErrorAlert message={cameraError} />}
              {error && <ErrorAlert message={error} />}

              {/* Webcam Container */}
              {isCameraActive && (
                <div className="space-y-4">
                  <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                    <WebcamPreview 
                      ref={videoRef} 
                      onStreamReady={handleStreamReady}
                      onStreamEnd={handleStreamEnd}
                    />
                  </div>
                  <button
                    onClick={captureImage}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Capture Photo
                  </button>
                </div>
              )}

              {/* Image Preview */}
              {imageURL && !isCameraActive && (
                <div className="relative rounded-lg overflow-hidden shadow-lg">
                  <img
                    src={imageURL}
                    alt="Uploaded attire"
                    className="w-full object-contain max-h-96"
                  />
                </div>
              )}

              {isLoading && (
                <div className="text-center p-6">
                  <RefreshCw className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
                  <p className="text-gray-600">Analyzing image...</p>
                </div>
              )}

              {/* Prediction Results */}
              {prediction && !isLoading && !isCameraActive && (
                <div className={`p-6 rounded-lg ${
                  prediction.className.toLowerCase().includes('business pro') 
                    ? 'bg-green-100' 
                    : prediction.className.toLowerCase().includes('business cas')
                    ? 'bg-yellow-100'
                    : 'bg-red-100'
                } border shadow-sm`}>
                  <h2 className="text-xl font-semibold mb-3">Analysis Result</h2>
                  <p className="text-lg mb-2">
                    Your attire appears to be: <strong>
                      {prediction.className === "Business Pro..." ? "Business Professional" :
                      prediction.className === "Business Cas..." ? "Business Casual" : 
                      prediction.className}
                    </strong>
                  </p>
                  <p className="text-sm text-gray-600">
                    Confidence: {(prediction.probability * 100).toFixed(2)}%
                  </p>
                </div>
              )}
              
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttireChecker;