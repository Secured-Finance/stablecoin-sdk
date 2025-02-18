import { FC, ReactNode, useCallback } from "react";

interface CopyToClipboardProps {
  text: string;
  onCopy?: (copiedText: string, isSuccess: boolean) => void;
  children: ReactNode;
}

export const CopyToClipboard: FC<CopyToClipboardProps> = ({ text, onCopy, children }) => {
  const handleClick = useCallback(async () => {
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        onCopy?.(text, true);
      } catch (error) {
        onCopy?.(text, false);
      }
    } else {
      onCopy?.(text, false);
    }
  }, [text, onCopy]);

  return <span onClick={handleClick}>{children}</span>;
};
