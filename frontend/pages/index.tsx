/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState } from "react";
import Image from "next/image"; // Added for Hero Image
import { ErrorMessage } from "@/components/ErrorMessage";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetStaticProps } from "next";
import Layout from "@/components/Layout";

export default function Classify() {
  const { t } = useTranslation("common");
  const [image, setImage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null); // Added to store actual file for API
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [classification, setClassification] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setClassification(null);
    setFile(selectedFile);
    
    const imageUrl = URL.createObjectURL(selectedFile);
    setImage(imageUrl);
  };

  const handleClassify = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error("Classification failed");

      const result = await response.json();
      setClassification(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="FlavorSnap - AI Food Classification" description="Instantly identify food with AI-powered image recognition">
      
      {/* --- HERO SECTION (Issue #24 Fix) --- */}
      <div className="w-full flex justify-center pt-6 px-6">
        <div className="relative w-full max-w-[500px] h-[300px] overflow-hidden rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800">
          <Image 
            src="/images/hero_img.png" 
            alt="FlavorSnap Hero"
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>
      {/* ------------------------------------ */}

      <div className="flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold mb-2">{t("snap_your_food")} 🍛</h1>
        <p className="text-gray-500 mb-6">Upload a photo to see the magic</p>

        {error && (
          <ErrorMessage
            message={error}
            onRetry={handleClassify}
            onDismiss={() => setError(null)}
          />
        )}

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full mb-4 transition-all"
        >
          {t("open_camera")}
        </button>
        
        {image && (
          <div className="mt-6 text-center">
            <img
              src={image}
              alt={t("preview_alt")}
              className="rounded-xl shadow-md max-w-sm mx-auto mb-4 border-2 border-accent/20"
            />

            <button
              onClick={handleClassify}
              disabled={loading}
              className="bg-accent text-white px-10 py-3 rounded-full hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
            >
              {loading ? t('classifying') : t('classify_food')}
            </button>

            {classification && (
              <div className="mt-6 p-6 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-900 rounded-2xl shadow-sm max-w-sm mx-auto">
                <h3 className="font-bold text-xl text-green-600 mb-2">{classification.label}</h3>
                <p className="text-sm text-gray-500">
                  Confidence: {(classification.confidence * 100).toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common"])),
  },
});