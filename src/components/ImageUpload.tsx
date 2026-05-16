import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  onUploadComplete: (urls: string[]) => void;
  maxFiles?: number;
  bucket?: string;
  folder?: string;
  label?: string;
}

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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!session) {
      alert('Authentication required for uploads.');
      return;
    }
    
    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', bucket);
        formData.append('folder', folder);

        // Upload via our backend proxy to bypass RLS issues
        const response = await fetch('http://localhost:3000/storage/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Upload failed');
        }

        const { url } = await response.json();
        uploadedUrls.push(url);
        
        if (file.type.startsWith('image/')) {
          setPreviews(prev => [...prev, url]);
        }
      }
      onUploadComplete(uploadedUrls);
    } catch (error: any) {
      console.error('[Upload Error]', error);
      alert('Error uploading: ' + (error.message || 'Check your connection or file size.'));
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete, bucket, folder, session]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': []
    },
    maxFiles
  });

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={cn(
          "border-2 border-dashed rounded-[2.5rem] p-10 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-4 bg-surface-base/50 group hover:bg-indigo-600/5 hover:border-indigo-500/30 shadow-inner",
          isDragActive ? "border-indigo-500 bg-indigo-600/10" : "border-black/5"
        )}
      >
        <input {...getInputProps()} />
        <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600/10 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110 shadow-lg shadow-indigo-600/5">
           {uploading ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
        </div>
        <div>
          <p className="text-text-main font-black italic uppercase tracking-tighter text-lg leading-none">{label}</p>
          <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest mt-2">Maximum {maxFiles} Files (JPG, PNG, PDF)</p>
        </div>
      </div>

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
