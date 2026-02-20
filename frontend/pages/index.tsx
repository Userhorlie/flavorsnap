import { useRef, useState } from "react";
import { api } from "@/utils/api";
import { ErrorMessage } from "@/components/ErrorMessage";

export default function Classify() {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classification, setClassification] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
      setError(null);
      setClassification(null);
    }
  };

  const handleClassify = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);

    try {
      // Example API call with error handling
      const response = await api.post('/api/classify', {
        image: image
      }, {
        retries: 2,
        retryDelay: 1000
      });

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setClassification(response.data);
      }
    } catch (err) {
      setError('Failed to classify image. Please try again.');
      console.error('Classification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  // Handle file selection
  const handleFileChange = (file: File) => {
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  };

  // Spinner Component
  const Spinner = () => (
    <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin" />
  );

  // Skeleton Loader
  const Skeleton = () => (
    <div className="animate-pulse space-y-4 mt-6 w-full max-w-md">
      <div className="h-6 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-40 bg-gray-200 rounded-xl"></div>
    </div>
  );

  const handleSubmit = async () => {
    if (!selectedFile) return;

    try {
      setError("");
      setIsUploading(true);
      setProgress(10);

      // Simulate upload phase
      await new Promise((res) => setTimeout(res, 800));
      setProgress(40);
      setIsUploading(false);

      setIsClassifying(true);

      // Fake gradual progress before API finishes
      let fakeProgress = 40;
      const interval = setInterval(() => {
        fakeProgress += 5;
        if (fakeProgress <= 90) {
          setProgress(fakeProgress);
        }
      }, 300);

      // REAL API CALL
      const formData = new FormData();
      formData.append("image", selectedFile);

      const response = await fetch("/api/classify", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);

      if (!response.ok) {
        throw new Error("Classification failed");
      }

      const data = await response.json();

      setResult(data);
      setProgress(100);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsUploading(false);
      setIsClassifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h2 className="text-3xl font-bold mb-6">Snap Your Food 🍛</h2>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={handleImageChange}
        className="hidden"
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        className="bg-accent text-white px-6 py-3 rounded-full mb-4"
      >
        Open Camera
      </button>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => handleClassify()}
          onDismiss={() => setError(null)}
        />
      )}

      {image && (
        <div className="mt-6 text-center">
          <img
            src={image}
            alt="Preview"
            className="rounded-xl shadow-md max-w-sm mx-auto mb-4"
          />
          
          <button
            onClick={handleClassify}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Classifying...' : 'Classify Food'}
          </button>

          {classification && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg max-w-sm mx-auto">
              <h3 className="font-semibold text-green-800 mb-2">Classification Result:</h3>
              <p className="text-green-700">{JSON.stringify(classification, null, 2)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
