import { Dialog, DialogPanel } from '@headlessui/react';

export function Modal({
  children,
  open,
  onClose,
}: {
  children: React.ReactNode;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center"
    >
      <DialogPanel className="bg-white rounded shadow-md">
        <div>
          <button onClick={() => onClose()} className="w-8 h-8">
            ✕
          </button>
        </div>
        <div className="p-8">{children}</div>
      </DialogPanel>
    </Dialog>
  );
}
