import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

export default function Classify() {
  const router = useRouter();

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
    <div className="min-h-screen bg-muted flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 text-center">
        <h1 className="text-2xl font-bold mb-4 text-primary">
          🍲 Classify Your Dish
        </h1>

        {/* Image Preview */}
        {preview && (
          <div className="mb-4">
            <Image
              src={preview}
              alt="Preview"
              width={400}
              height={250}
              className="rounded-xl object-cover"
            />
          </div>
        )}

        {/* File Input */}
        <input
          type="file"
          accept="image/*"
          disabled={isUploading || isClassifying}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileChange(e.target.files[0]);
            }
          }}
          className="mb-4 w-full text-sm"
        />

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!selectedFile || isUploading || isClassifying}
          className={`w-full py-3 rounded-full font-semibold flex justify-center items-center gap-2 transition ${
            !selectedFile || isUploading || isClassifying
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-accent hover:bg-orange-600 text-white"
          }`}
        >
          {isUploading ? (
            <>
              <Spinner />
              Uploading....
            </>
          ) : isClassifying ? (
            <>
              <Spinner />
              Classifying....
            </>
          ) : (
            "Identify Dish"
          )}
        </button>

        {/* Progress Bar */}
        {(isUploading || isClassifying) && (
          <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
            <div
              className="bg-orange-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm mt-4">{error}</p>
        )}

        {/* Skeleton Loader */}
        {isClassifying && <Skeleton />}

        {/* Result Display */}
        {!isClassifying && result && (
          <div className="mt-6 text-left bg-gray-50 p-4 rounded-xl shadow-inner">
            <h2 className="text-xl font-bold mb-2">
              {result.name || "Unknown Dish"}
            </h2>
            <p className="text-gray-700 text-sm mb-3">
              {result.description || "No description available."}
            </p>

            {result.recipe && (
              <>
                <h3 className="font-semibold mb-1">Recipe:</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {result.recipe.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => router.push("/")}
          className="mt-6 text-sm text-gray-500 hover:underline"
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}
