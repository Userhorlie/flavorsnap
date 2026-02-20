import { useRef, useState } from "react";

export default function Classify() {
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
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
        className="bg-accent text-white px-6 py-3 rounded-full"
      >
        Open Camera
      </button>

      {image && (
        <div className="mt-6">
          <img
            src={image}
            alt="Preview"
            className="rounded-xl shadow-md max-w-sm"
          />
        </div>
      )}
    </div>
  );
}
