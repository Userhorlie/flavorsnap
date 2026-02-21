import { useMemo, useState } from "react";
import Head from "next/head";
import type { GetStaticProps } from "next";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ErrorMessage } from "@/components/ErrorMessage";
import { api } from "@/utils/api";

type PredictionItem = {
  label: string;
  confidence: number;
};

type PredictionResponse = {
  prediction?: string;
  food?: string;
  confidence?: number;
  predictions?: Array<{ label?: string; confidence?: number }>;
};

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

function normalizePredictions(data: PredictionResponse): PredictionItem[] {
  if (Array.isArray(data.predictions) && data.predictions.length > 0) {
    return data.predictions
      .filter((item) => typeof item?.label === "string" && typeof item?.confidence === "number")
      .map((item) => ({ label: item.label as string, confidence: item.confidence as number }))
      .sort((a, b) => b.confidence - a.confidence);
  }

  const label = data.prediction ?? data.food;
  if (label && typeof data.confidence === "number") {
    return [{ label, confidence: data.confidence }];
  }

  if (label) {
    return [{ label, confidence: 0 }];
  }

  return [];
}

export default function ClassifyPage() {
  const { t } = useTranslation("common");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topPrediction = useMemo(() => predictions[0], [predictions]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setError(null);
    setPredictions([]);

    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setError("Only .jpg, .jpeg, .png and .webp formats are supported.");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleClassify = async () => {
    if (!selectedFile) {
      setError("Please choose an image first.");
      return;
    }

    setLoading(true);
    setError(null);
    setPredictions([]);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile, selectedFile.name);

      const endpoints = ["/ml-model-api/predict", "/api/predict", "/api/classify"];

      let lastError = "Classification failed";
      let parsed: PredictionItem[] = [];

      for (const endpoint of endpoints) {
        const response = await api.post<PredictionResponse>(endpoint, formData, {
          retries: 1,
          retryDelay: 500,
        });

        if (response.error) {
          lastError = response.error;
          continue;
        }

        parsed = normalizePredictions(response.data ?? {});
        if (parsed.length > 0) {
          break;
        }
      }

      if (parsed.length === 0) {
        throw new Error(lastError || "No prediction returned by API");
      }

      setPredictions(parsed);
    } catch (e) {
      const message = e instanceof Error ? e.message : t("error_classification_failed");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <Head>
        <title>{t("app_title", "FlavorSnap")} - Classify</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 flex justify-end sm:mb-8">
          <LanguageSwitcher />
        </div>

        <h1 className="mb-6 text-center text-2xl font-bold sm:text-3xl md:text-4xl">
          {t("classify_food", "Classify Food")}
        </h1>

        <div className="mx-auto w-full max-w-xl rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:p-6">
          <label htmlFor="image-upload" className="mb-2 block text-sm font-medium text-gray-700">
            {t("open_camera", "Open Camera")}
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="block min-h-[44px] w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2"
          />

          {previewUrl && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-gray-700">{t("preview_alt", "Preview")}</p>
              <img
                src={previewUrl}
                alt={t("preview_alt", "Preview")}
                className="mx-auto aspect-[4/3] w-full max-w-md rounded-xl object-cover shadow"
              />
            </div>
          )}

          <div className="mt-5">
            <button
              type="button"
              onClick={handleClassify}
              disabled={!selectedFile || loading}
              className="min-h-[44px] w-full rounded-full bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? t("classifying", "Classifying...") : t("classify_food", "Classify Food")}
            </button>
          </div>

          {error && (
            <div className="mt-4">
              <ErrorMessage message={error} onDismiss={() => setError(null)} />
            </div>
          )}

          {topPrediction && (
            <div className="mt-5 rounded-lg bg-green-50 p-4">
              <h2 className="mb-3 text-lg font-semibold text-green-800">
                {t("classification_result", "Classification Result")}
              </h2>
              <p className="text-green-800">
                <span className="font-semibold">{t("result_label", "Prediction")}: </span>
                {topPrediction.label}
              </p>
              <p className="text-green-800">
                <span className="font-semibold">{t("result_confidence", "Confidence")}: </span>
                {(topPrediction.confidence * 100).toFixed(1)}%
              </p>

              {predictions.length > 1 && (
                <ul className="mt-3 space-y-1 text-sm text-green-900">
                  {predictions.slice(1, 5).map((item) => (
                    <li key={`${item.label}-${item.confidence}`}>
                      {item.label}: {(item.confidence * 100).toFixed(1)}%
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common"])),
  },
});
