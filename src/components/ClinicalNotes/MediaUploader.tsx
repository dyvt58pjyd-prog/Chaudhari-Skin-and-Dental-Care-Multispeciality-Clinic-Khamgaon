import React, { useState, useRef } from 'react';
import { ClinicalMedia } from '../../types/clinic';
import { sound } from '../../services/sound';
import {
  Camera,
  Image as ImageIcon,
  Upload,
  X,
  Eye,
  Maximize2,
  Trash2,
  Plus
} from 'lucide-react';

interface MediaUploaderProps {
  photos: ClinicalMedia[];
  onPhotosChange: (updated: ClinicalMedia[]) => void;
  label?: string;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  photos,
  onPhotosChange,
  label = 'Clinical Photos & Media (Lesions, X-Rays, Intraoral)',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedType, setSelectedType] = useState<ClinicalMedia['type']>('clinical_photo');
  const [captionInput, setCaptionInput] = useState('');
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Helper to resize & compress image in canvas before saving
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    sound.playTapSound();

    const newMediaItems: ClinicalMedia[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const compressedBase64 = await compressImage(file);
        newMediaItems.push({
          id: `media-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          url: compressedBase64,
          caption: captionInput.trim() || file.name.replace(/\.[^/.]+$/, ''),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: selectedType,
        });
      } catch (err) {
        console.error('Failed to compress image:', err);
      }
    }

    if (newMediaItems.length > 0) {
      onPhotosChange([...photos, ...newMediaItems]);
      setCaptionInput('');
    }
  };

  const removePhoto = (id: string) => {
    sound.playTapSound();
    onPhotosChange(photos.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Camera className="w-4 h-4 text-cyan-400" />
          {label} ({photos.length})
        </label>

        {/* Media type selector */}
        <div className="flex gap-1 text-[11px]">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as ClinicalMedia['type'])}
            className="bg-slate-900 border border-slate-700 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none"
          >
            <option value="clinical_photo">Clinical Photo</option>
            <option value="dermatoscope">Dermatoscope</option>
            <option value="intraoral">Intraoral Photo</option>
            <option value="xray">X-Ray / IOPA</option>
            <option value="document">Report / Document</option>
          </select>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        accept="image/*"
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Upload & Camera Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="px-3.5 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/80 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
        >
          <Camera className="w-4 h-4" />
          <span>Take Camera Photo</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
        >
          <Upload className="w-4 h-4 text-slate-400" />
          <span>Upload Image / X-Ray</span>
        </button>

        <input
          type="text"
          value={captionInput}
          onChange={(e) => setCaptionInput(e.target.value)}
          placeholder="Optional caption (e.g. Left cheek mole, Tooth 46 IOPA)"
          className="flex-1 min-w-[200px] bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
        />
      </div>

      {/* Thumbnails Gallery */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-2">
          {photos.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-square shadow-md"
            >
              <img
                src={item.url}
                alt={item.caption}
                className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform"
                onClick={() => setLightboxUrl(item.url)}
              />

              {/* Type Badge */}
              <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[9px] font-bold text-cyan-300 uppercase">
                {item.type.replace('_', ' ')}
              </span>

              {/* Action buttons on hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setLightboxUrl(item.url)}
                  className="p-1.5 rounded-lg bg-slate-800 text-white hover:bg-cyan-600 transition"
                  title="Enlarge"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removePhoto(item.id)}
                  className="p-1.5 rounded-lg bg-red-950 text-red-300 hover:bg-red-600 hover:text-white transition"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Caption footer */}
              {item.caption && (
                <div className="absolute bottom-0 inset-x-0 p-1 bg-black/80 backdrop-blur-sm text-[10px] text-slate-300 truncate text-center">
                  {item.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 italic py-1">
          No clinical photos or radiographs attached yet. Tap camera or upload above.
        </p>
      )}

      {/* Lightbox Enlarged Preview Modal */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxUrl}
              alt="Enlarged view"
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-slate-700"
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 text-white hover:bg-slate-700 flex items-center justify-center shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
