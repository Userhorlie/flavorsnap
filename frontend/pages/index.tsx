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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_MOBILE_DIMENSION = 1280;
const MOBILE_IMAGE_QUALITY = 0.82;

const validationSchema = z.object({
  image: z
    .any()
    .refine((files) => files?.length === 1, "Image is required.")
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, "Max file size is 10MB.")
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    ),
});

type FormValues = z.infer<typeof validationSchema>;

async function optimizeImageForUpload(file: File): Promise<File> {
  try {
    if (!file.type.startsWith("image/")) return file;
    if (file.size <= 2 * 1024 * 1024) return file;

    const bitmap = await createImageBitmap(file);
    const largestSide = Math.max(bitmap.width, bitmap.height);
    const scale = Math.min(1, MAX_MOBILE_DIMENSION / largestSide);

    if (scale === 1) return file;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", MOBILE_IMAGE_QUALITY)
    );

    if (!blob) return file;

    const safeName = file.name.replace(/\.[^/.]+$/, "");
    return new File([blob], `${safeName}.webp`, { type: "image/webp" });
  } catch {
    return file;
  }
}

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
        return () => URL.revokeObjectURL(objectUrl);
      }
    } else {
      setPreview(null);
    }
  }, [imageFiles]);

  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post("/api/classify", formData, {
        retries: 2,
        retryDelay: 1000,
      });

      if (response.error) {
        throw new Error(response.error);
      }
      return response.data;
    },
    onSuccess: (data) => {
      setClassification(data);
    },
    onError: (error: Error) => {
      setApiError(error.message);
    },
  });

  const onSubmit = async (data: FormValues) => {
    setApiError(null);
    setClassification(null);

    const file = data.image[0];
    const optimizedFile = await optimizeImageForUpload(file);

    const announcement = document.getElementById("classification-announcement");
    if (announcement) {
      announcement.textContent = t("classifying");
    }

    const formData = new FormData();
    formData.append("image", optimizedFile, optimizedFile.name);

    mutation.mutate(formData);
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 md:px-8 lg:px-10 xl:px-12">
      <Head>
        <title>{t("app_title", "FlavorSnap - AI Food Classification")}</title>
        <meta
          name="description"
          content={t(
            "app_description",
            "Snap a picture of your food and let AI identify the dish instantly! Specialized in Nigerian cuisine."
          )}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />

        <meta property="og:title" content="FlavorSnap - AI Food Classification" />
        <meta
          property="og:description"
          content="Snap a picture of your food and let AI identify the dish instantly!"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://flavorsnap.vercel.app" />
        <meta
          property="og:image"
          content="https://flavorsnap.vercel.app/icons/icon-512x512.png"
        />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="FlavorSnap" />
        <meta name="twitter:description" content="AI-powered food recognition." />
        <meta
          name="twitter:image"
          content="https://flavorsnap.vercel.app/icons/icon-512x512.png"
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "FlavorSnap",
              applicationCategory: "LifestyleApplication",
              operatingSystem: "Any",
              description:
                "AI-powered food recognition and calorie tracking application specialized in Nigerian cuisine.",
              image: "https://flavorsnap.vercel.app/icons/icon-512x512.png",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
            }),
          }}
        />
      </Head>

      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 flex justify-end sm:mb-8">
          <LanguageSwitcher />
        </div>

        <h1 className="mb-5 text-center text-2xl font-bold sm:text-3xl md:text-4xl">
          {t("snap_your_food")}
        </h1>

        <div id="classification-announcement" role="status" aria-live="polite" className="sr-only" />

        <div id="error-announcement" role="alert" aria-live="assertive" className="sr-only" />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mx-auto flex w-full max-w-md flex-col items-center"
        >
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
            onClick={() => hiddenInputRef.current?.click()}
            className="mb-4 min-h-[44px] w-full rounded-full bg-accent px-6 py-3 text-white focus:outline-none focus:ring-4 focus:ring-accent/50 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:w-auto"
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
            <div className="mt-6 w-full text-center" role="region" aria-label={t("image_preview")}>
              <img
                src={preview}
                alt={t("preview_alt")}
                className="mx-auto mb-4 aspect-[4/3] w-full max-w-[280px] rounded-xl object-cover shadow-md sm:max-w-xs md:max-w-sm lg:max-w-md"
                loading="lazy"
                decoding="async"
              />

              <button
                type="submit"
                disabled={mutation.isPending}
                className="min-h-[44px] w-full rounded-full bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-600/50 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:w-auto"
                aria-label={mutation.isPending ? t("classifying") : t("classify_food")}
                aria-describedby={mutation.isPending ? "classification-announcement" : undefined}
              >
                {mutation.isPending ? t("classifying") : t("classify_food")}
              </button>

              {classification && (
                <div
                  className="mx-auto mt-6 w-full max-w-sm rounded-lg bg-green-50 p-4 text-left"
                  role="region"
                  aria-label={t("classification_result")}
                >
                  <h3 className="mb-2 font-semibold text-green-800">
                    {t("classification_result")}:
                  </h3>
                  <p className="break-words text-green-700">
                    {JSON.stringify(classification, null, 2)}
                  </p>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale ?? "en", ["common"])),
  },
});
