import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  bucket?: string;
  folder?: string;
  label?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ImageUpload({ 
  onUploadComplete, 
  maxFiles = 5, 
  bucket = 'vehicles', 
  folder = 'inventory',
  label = 'Upload Assets'
}: ImageUploadProps) {
  const { session } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [failedFiles, setFailedFiles] = useState<File[]>([]);

  const uploadFiles = useCallback(async (files: File[]) => {
    if (!session?.access_token) {
      setError('Authentication required. Please log in again.');
      return;
    }

    // Validate file sizes
    const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      setError(`${oversized.length} file(s) exceed the 10MB limit. Please compress and retry.`);
      return;
    }
    
    setUploading(true);
    setError(null);
    setFailedFiles([]);
    const uploadedUrls: string[] = [];
    const failed: File[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length });

        try {
          // Convert file to Base64
          const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(f);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
          });
          const base64Data = await toBase64(file);

          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/storage/upload-base64`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              base64: base64Data,
              filename: file.name,
              bucket: bucket,
              folder: folder
            })
          });

          if (!response.ok) {
            let errorMsg = `Upload failed (HTTP ${response.status})`;
            try {
              const errorData = await response.json();
              errorMsg = errorData.message || errorMsg;
            } catch {}
            throw new Error(errorMsg);
          }

          const { url } = await response.json();
          uploadedUrls.push(url);
          
          if (file.type.startsWith('image/')) {
            setPreviews(prev => [...prev, url]);
          }
        } catch (fileError: any) {
          console.error(`[Upload Error] ${file.name}:`, fileError);
          failed.push(file);
        }
      }

      if (uploadedUrls.length > 0) {
        onUploadComplete(uploadedUrls);
      }

      if (failed.length > 0) {
        setFailedFiles(failed);
        setError(`${failed.length} of ${files.length} file(s) failed to upload.`);
      }
    } catch (error: any) {
      console.error('[Upload Error]', error);
      setError(error.message || 'Upload failed. Check your connection.');
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }, [onUploadComplete, bucket, folder, session]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    await uploadFiles(acceptedFiles);
  }, [uploadFiles]);

  const retryFailed = useCallback(async () => {
    if (failedFiles.length > 0) {
      await uploadFiles(failedFiles);
    }
  }, [failedFiles, uploadFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.gif', '.jfif'],
      'application/pdf': ['.pdf']
    },
    maxFiles,
    disabled: uploading
  });

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-[2.5rem] p-10 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 bg-surface-base/50 group hover:bg-indigo-600/5 hover:border-indigo-500/30 shadow-inner",
          isDragActive ? "border-indigo-500 bg-indigo-600/10" : "border-black/5",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600/10 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110 shadow-lg shadow-indigo-600/5">
           {uploading ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
        </div>
        <div>
          <p className="text-text-main font-black italic uppercase tracking-tighter text-lg leading-none">
            {uploading && progress ? `Uploading ${progress.current}/${progress.total}...` : label}
          </p>
          <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-2">
            Maximum {maxFiles} Files · JPG, PNG, HEIC, PDF · 10MB Max
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-500">{error}</p>
            {failedFiles.length > 0 && (
              <button 
                onClick={retryFailed}
                className="mt-2 flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-400 transition-colors"
              >
                <RefreshCw size={12} /> Retry Failed Uploads
              </button>
            )}
          </div>
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {previews.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-xl group">
               <img src={url} alt="Preview" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <CheckCircle2 size={24} className="text-emerald-500" />
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

