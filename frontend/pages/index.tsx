/* eslint-disable @typescript-eslint/no-explicit-any */
import { useRef, useState, useEffect } from "react";
import Head from "next/head";
import { api } from "@/utils/api";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useTranslation } from "next-i18next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import type { GetStaticProps } from "next";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import * as z from "zod";
import { analytics } from "@/utils/analytics";
import { PerformanceTimer } from "@/utils/performance";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const validationSchema = z.object({
  image: z
    .any()
    .refine((files) => files?.length === 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, `Max file size is 10MB.`)
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

type FormValues = z.infer<typeof validationSchema>;

export default function Classify() {
  const { t } = useTranslation("common");
  const [preview, setPreview] = useState<string | null>(null);
  const [classification, setClassification] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    mode: "onChange",
  });

  const imageFiles = watch("image");
  const { ref: registerRef, ...registerRest } = register("image");

  useEffect(() => {
    if (imageFiles && imageFiles.length > 0) {
      const file = imageFiles[0];
      if (file.type && file.type.startsWith("image/")) {
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setClassification(null);
        setApiError(null);
        
        // Track image upload
        analytics.trackImageUpload(file.size, file.type);
        
        return () => URL.revokeObjectURL(objectUrl);
      }
    } else {
      setPreview(null);
    }
  }, [imageFiles]);

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const timer = new PerformanceTimer('classification_request');
      
      try {
        const response = await api.post('/api/classify', formData, {
          retries: 2,
          retryDelay: 1000,
        });

        if (response.error) {
          throw new Error(response.error);
        }
        
        const duration = timer.end('Classification', 'success');
        
        // Track successful classification
        if (response.data) {
          analytics.trackClassification({
            prediction: response.data.prediction || 'unknown',
            confidence: response.data.confidence || 0,
            fileSize: formData.get('image') ? (formData.get('image') as File).size : 0,
            fileType: formData.get('image') ? (formData.get('image') as File).type : 'unknown',
            duration,
            success: true,
          });
        }
        
        return response.data;
      } catch (error) {
        timer.end('Classification', 'error');
        throw error;
      }
    },
    onSuccess: (data) => {
      setClassification(data);
    },
    onError: (error: Error) => {
      setApiError(error.message);
      
      // Track API error
      analytics.trackApiError('/api/classify', 500, error.message);
      
      // Track failed classification
      const file = imageFiles?.[0];
      if (file) {
        analytics.trackClassification({
          prediction: 'error',
          confidence: 0,
          fileSize: file.size,
          fileType: file.type,
          success: false,
        });
      }
    },
  });

  const onSubmit = (data: FormValues) => {
    setApiError(null);
    setClassification(null);
    const file = data.image[0];

    // Track classify button click
    analytics.trackButtonClick('classify_food', 'main_page');

    // Announce to screen readers that classification is starting
    const announcement = document.getElementById('classification-announcement');
    if (announcement) {
      announcement.textContent = t('classifying');
    }

    const formData = new FormData();
    formData.append("image", file);

    mutation.mutate(formData);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <Head>
        <title>{t("app_title", "FlavorSnap - AI Food Classification")}</title>
        <meta name="description" content={t("app_description", "Snap a picture of your food and let AI identify the dish instantly! Specialized in Nigerian cuisine.")} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        {/* Open Graph */}
        <meta property="og:title" content="FlavorSnap - AI Food Classification" />
        <meta property="og:description" content="Snap a picture of your food and let AI identify the dish instantly!" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://flavorsnap.vercel.app" />
        <meta property="og:image" content="https://flavorsnap.vercel.app/icons/icon-512x512.png" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FlavorSnap" />
        <meta name="twitter:description" content="AI-powered food recognition." />
        <meta name="twitter:image" content="https://flavorsnap.vercel.app/icons/icon-512x512.png" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "FlavorSnap",
              "applicationCategory": "LifestyleApplication",
              "operatingSystem": "Any",
              "description": "AI-powered food recognition and calorie tracking application specialized in Nigerian cuisine.",
              "image": "https://flavorsnap.vercel.app/icons/icon-512x512.png",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              }
            })
          }}
        />
      </Head>
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>

      <h1 className="text-3xl font-bold mb-6">{t("snap_your_food")} 🍛</h1>

      {/* Screen reader announcements */}
      <div
        id="classification-announcement"
        role="status"
        aria-live="polite"
        className="sr-only"
      />

      <div
        id="error-announcement"
        role="alert"
        aria-live="assertive"
        className="sr-only"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-center w-full max-w-md">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          {...registerRest}
          ref={(e) => {
            registerRef(e);
            hiddenInputRef.current = e;
          }}
          aria-label={t("select_image_file")}
        />

        <button
          type="button"
          onClick={() => {
            analytics.trackButtonClick('open_camera', 'main_page');
            hiddenInputRef.current?.click();
          }}
          className="bg-accent text-white px-6 py-3 rounded-full mb-4 focus:outline-none focus:ring-4 focus:ring-accent/50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label={t("open_camera")}
        >
          {t("open_camera")}
        </button>

        {errors.image && (
          <div className="mb-4 w-full">
            <ErrorMessage
              message={errors.image.message as string}
              onDismiss={() => reset({ image: undefined })}
            />
          </div>
        )}

        {apiError && (
          <div className="mb-4 w-full">
            <ErrorMessage
              message={apiError}
              onRetry={handleSubmit(onSubmit)}
              onDismiss={() => setApiError(null)}
            />
          </div>
        )}

        {preview && !errors.image && (
          <div className="mt-6 text-center w-full" role="region" aria-label={t("image_preview")}>
            <img
              src={preview}
              alt={t("preview_alt")}
              className="rounded-xl shadow-md max-w-sm mx-auto mb-4"
            />

            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-blue-600/50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              aria-label={mutation.isPending ? t('classifying') : t('classify_food')}
              aria-describedby={mutation.isPending ? 'classification-announcement' : undefined}
            >
              {mutation.isPending ? t('classifying') : t('classify_food')}
            </button>

            {classification && (
              <div
                className="mt-6 p-4 bg-green-50 rounded-lg max-w-sm mx-auto"
                role="region"
                aria-label={t('classification_result')}
              >
                <h3 className="font-semibold text-green-800 mb-2">{t('classification_result')}:</h3>
                <p className="text-green-700">{JSON.stringify(classification, null, 2)}</p>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common"])),
  },
});
