import Github from "./icons/Github";
import Twitter from "./icons/Twitter";
import { ConnectionStatus } from "./ui/ConnectionStatus";

export const NetBar = () => {
  return (
    <div className="inline-flex items-center justify-center w-full h-full thin-scroll">
      <div className="z-40 h-full flex flex-row w-full items-center justify-end gap-3 panel-imperial text-text-default px-3 overflow-hidden">
        {/* Connection Status */}
        <ConnectionStatus showLabel size="sm" />

        {/* Divider */}
        <div className="w-px h-4 bg-grid" />

        {/* Social Links */}
        <a
          href="https://github.com/jogeshwar01"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="flex items-center justify-center w-8 h-8 cursor-pointer hover:text-signal-green transition-colors"
        >
          <Github className="w-4 h-4" />
        </a>

        <a
          href="https://x.com/jogeshwar01"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Twitter/X"
          className="flex items-center justify-center w-8 h-8 cursor-pointer hover:text-signal-green transition-colors"
        >
          <Twitter className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
};
