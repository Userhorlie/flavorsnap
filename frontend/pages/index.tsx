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
