"use client";

export type PhotoKey =
  | "frontLeft"
  | "frontRight"
  | "rearLeft"
  | "rearRight"
  | "interior"
  | "damage";

export type PhotoCollection = Record<PhotoKey, string>;

const photoConfig: { key: PhotoKey; label: string; helper: string }[] = [
  { key: "frontLeft", label: "Avant gauche", helper: "Angle avant gauche" },
  { key: "frontRight", label: "Avant droit", helper: "Angle avant droit" },
  { key: "rearLeft", label: "Arrière gauche", helper: "Angle arrière gauche" },
  { key: "rearRight", label: "Arrière droit", helper: "Angle arrière droit" },
  { key: "interior", label: "Intérieur", helper: "Vue intérieure globale" },
  { key: "damage", label: "Défaut visible", helper: "Rayure / impact / zone sensible" },
];

type Props = {
  title: string;
  subtitle: string;
  photos: PhotoCollection;
  onChange: (key: PhotoKey, value: string) => void;
};

export default function VehicleCheckIn({
  title,
  subtitle,
  photos,
  onChange,
}: Props) {
  const completedCount = Object.values(photos).filter(Boolean).length;

  const handlePhotoChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    key: PhotoKey
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      const result = reader.result as string;
      onChange(key, result);
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-3xl rounded-3xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>

        <div className="rounded-full bg-black px-3 py-1 text-sm font-medium text-white">
          {completedCount}/{photoConfig.length}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {photoConfig.map((item) => {
          const preview = photos[item.key];

          return (
            <div
              key={item.key}
              className="rounded-2xl border border-black/10 bg-gray-50 p-3"
            >
              <div className="mb-2">
                <p className="font-medium">{item.label}</p>
                <p className="text-xs text-gray-500">{item.helper}</p>
              </div>

              {preview ? (
                <img
                  src={preview}
                  alt={item.label}
                  className="mb-3 h-40 w-full rounded-xl border object-cover"
                />
              ) : (
                <div className="mb-3 flex h-40 w-full items-center justify-center rounded-xl border border-dashed text-sm text-gray-400">
                  Aucune photo
                </div>
              )}

              <label className="block">
                <span className="flex w-full cursor-pointer items-center justify-center rounded-xl bg-black px-4 py-3 text-sm font-medium text-white">
                  {preview ? "Reprendre la photo" : "Prendre la photo"}
                </span>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e, item.key)}
                />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}