import React from 'react';
import { Modal } from './Modal';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string | null;
  title?: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ 
  isOpen, 
  onClose, 
  url, 
  title = 'Document Viewer' 
}) => {
  if (!url) return null;

  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith('data:image');
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-4xl">
      <div className="w-full h-[70vh] bg-bg-secondary rounded-xl overflow-hidden flex items-center justify-center">
        {isImage ? (
          <img src={url} alt={title} className="max-w-full max-h-full object-contain" />
        ) : (
          <iframe src={url} title={title} className="w-full h-full border-0" />
        )}
      </div>
    </Modal>
  );
};

export const DocumentPreviewButton: React.FC<{ url: string, title?: string, children: React.ReactNode, className?: string }> = ({ url, title, children, className }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <>
      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(true); }} className={className}>
        {children}
      </button>
      {isOpen && <DocumentViewerModal isOpen={isOpen} onClose={() => setIsOpen(false)} url={url} title={title} />}
    </>
  );
};
