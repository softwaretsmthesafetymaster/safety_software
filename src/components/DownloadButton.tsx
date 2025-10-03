import { useState } from "react";
import Button from "./UI/Button";
import { Download } from "lucide-react";

export default function DownloadButton({ handleExport }: { handleExport: (format: 'pdf' | 'excel' | 'word') => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      {/* Main Button */}
      <Button
        variant="secondary"
        icon={Download}
        onClick={() => setOpen(!open)}
      >
        Download
      </Button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => {
              handleExport("pdf");
              setOpen(false);
            }}
          >
            PDF
          </button>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => {
              handleExport("excel");
              setOpen(false);
            }}
          >
            Excel
          </button>
          <button
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => {
              handleExport("word");
              setOpen(false);
            }}
          >
            Word
          </button>
        </div>
      )}
    </div>
  );
}
