import Github from "./icons/Github";
import Twitter from "./icons/Twitter";

export const NetBar = () => {
  return (
    <div className="inline-flex items-center justify-center w-full h-full thin-scroll">
      <div className="z-40 h-full flex flex-row w-full items-center justify-center bg-container-bg text-text-default border border-container-border relative sm:p-2 overflow-hidden">
        <a
          href="https://github.com/jogeshwar01"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
          className="flex items-center justify-center w-10 h-full cursor-pointer hover:bg-container-bg-hover hover:text-signal-green transition-colors"
        >
          <Github className="w-5 h-5" />
        </a>

        <a
          href="https://x.com/jogeshwar01"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Twitter/X"
          className="flex items-center justify-center w-10 h-full cursor-pointer hover:bg-container-bg-hover hover:text-signal-green transition-colors"
        >
          <Twitter className="w-5 h-5" />
        </a>
      </div>
    </div>
  );
};
